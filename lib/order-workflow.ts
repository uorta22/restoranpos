import { OrderStatus, OrderType, PaymentStatus, PaymentMethod, OrderPriority, type Order, type OrderWorkflow } from './types'

/**
 * Sipariş tipi ve mevcut duruma göre bir sonraki olası durumları döndürür
 */
export function getNextPossibleStatuses(order: Order): OrderStatus[] {
  const { status, orderType, paymentStatus } = order

  switch (status) {
    case OrderStatus.PENDING_CONFIRMATION:
      return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED]

    case OrderStatus.CONFIRMED:
      if (orderType === OrderType.DINE_IN) {
        return [OrderStatus.PREPARING, OrderStatus.CANCELLED]
      } else {
        // Gel-Al ve Paket Servis için önce ödeme alınabilir
        return [OrderStatus.PREPARING, OrderStatus.READY_FOR_PAYMENT, OrderStatus.CANCELLED]
      }

    case OrderStatus.READY_FOR_PAYMENT:
      return paymentStatus === PaymentStatus.PAID ? [OrderStatus.PREPARING] : [OrderStatus.CANCELLED]

    case OrderStatus.PREPARING:
      return [OrderStatus.READY_FOR_SERVICE, OrderStatus.CANCELLED]

    case OrderStatus.READY_FOR_SERVICE:
      if (orderType === OrderType.DELIVERY) {
        return [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED]
      } else if (orderType === OrderType.DINE_IN) {
        return [OrderStatus.SERVED, OrderStatus.READY_FOR_PAYMENT]
      } else {
        // Gel-Al
        return [OrderStatus.COMPLETED]
      }

    case OrderStatus.OUT_FOR_DELIVERY:
      return [OrderStatus.COMPLETED, OrderStatus.CANCELLED]

    case OrderStatus.SERVED:
      return paymentStatus === PaymentStatus.PAID ? [OrderStatus.COMPLETED] : [OrderStatus.READY_FOR_PAYMENT]

    case OrderStatus.PAID:
      return [OrderStatus.COMPLETED]

    default:
      return []
  }
}

/**
 * Sipariş durumu değişikliğinin geçerli olup olmadığını kontrol eder
 */
export function isValidStatusTransition(from: OrderStatus, to: OrderStatus, orderType: OrderType): boolean {
  const possibleStatuses = getNextPossibleStatuses({
    status: from,
    orderType,
    paymentStatus: PaymentStatus.PENDING
  } as Order)

  return possibleStatuses.includes(to)
}

/**
 * Sipariş tipine göre tahmini hazırlanma süresini döndürür (dakika)
 */
export function getEstimatedPreparationTime(order: Order): number {
  const baseTime = order.items.reduce((total, item) => {
    // Her ürün için ortalama 3-5 dakika
    return total + (item.quantity * 4)
  }, 0)

  // Sipariş tipine göre ek süre
  let multiplier = 1
  switch (order.orderType) {
    case OrderType.DINE_IN:
      multiplier = 1.2 // Restoran siparişleri biraz daha uzun
      break
    case OrderType.TAKEAWAY:
      multiplier = 0.9 // Gel-Al siparişleri daha hızlı
      break
    case OrderType.DELIVERY:
      multiplier = 1.1 // Paket servis normal
      break
  }

  // Önceliğe göre ayarlama
  let priorityMultiplier = 1
  switch (order.priority) {
    case OrderPriority.URGENT:
      priorityMultiplier = 0.7
      break
    case OrderPriority.HIGH:
      priorityMultiplier = 0.8
      break
    case OrderPriority.LOW:
      priorityMultiplier = 1.3
      break
  }

  return Math.max(5, Math.round(baseTime * multiplier * priorityMultiplier))
}

/**
 * Sipariş için workflow bilgisi döndürür
 */
export function getOrderWorkflow(order: Order): OrderWorkflow {
  return {
    orderId: order.id,
    currentStatus: order.status,
    nextPossibleStatuses: getNextPossibleStatuses(order),
    requiresPayment: needsPayment(order),
    estimatedMinutes: getEstimatedPreparationTime(order),
    assignedStaff: getAssignedStaff(order),
    paymentStrategy: getPaymentStrategy(order.orderType),
    paymentRequirements: getPaymentRequirements(order)
  }
}

/**
 * Siparişin ödeme gerektirip gerektirmediğini kontrol eder
 */
export function needsPayment(order: Order): boolean {
  if (order.paymentStatus === PaymentStatus.PAID) return false

  return [
    OrderStatus.READY_FOR_PAYMENT,
    OrderStatus.SERVED
  ].includes(order.status)
}

/**
 * Sipariş tipi için ödeme stratejisi döndürür
 */
export function getPaymentStrategy(orderType: OrderType): {
  requiresUpfrontPayment: boolean
  allowsCashOnDelivery: boolean
  allowsTablePayment: boolean
  preferredMethods: PaymentMethod[]
} {
  switch (orderType) {
    case OrderType.DINE_IN:
      return {
        requiresUpfrontPayment: false,
        allowsCashOnDelivery: false,
        allowsTablePayment: true,
        preferredMethods: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.MEAL_CARD]
      }

    case OrderType.TAKEAWAY:
      return {
        requiresUpfrontPayment: true,
        allowsCashOnDelivery: false,
        allowsTablePayment: false,
        preferredMethods: [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE]
      }

    case OrderType.DELIVERY:
      return {
        requiresUpfrontPayment: false,
        allowsCashOnDelivery: true,
        allowsTablePayment: false,
        preferredMethods: [PaymentMethod.CASH, PaymentMethod.ONLINE]
      }

    default:
      return {
        requiresUpfrontPayment: false,
        allowsCashOnDelivery: false,
        allowsTablePayment: false,
        preferredMethods: [PaymentMethod.CASH]
      }
  }
}

/**
 * Ödeme gereksinimlerini kontrol eder
 */
export function getPaymentRequirements(order: Order): {
  mustPayNow: boolean
  canPayLater: boolean
  suggestedTiming: 'before_preparation' | 'before_service' | 'after_service'
  reason: string
} {
  const strategy = getPaymentStrategy(order.orderType)

  // Gel-Al siparişleri için ödeme hazırlık öncesi gerekli
  if (order.orderType === OrderType.TAKEAWAY) {
    return {
      mustPayNow: strategy.requiresUpfrontPayment,
      canPayLater: false,
      suggestedTiming: 'before_preparation',
      reason: 'Gel-Al siparişleri için ödeme önceden alınması gerekiyor'
    }
  }

  // Paket servis için esnek ödeme
  if (order.orderType === OrderType.DELIVERY) {
    return {
      mustPayNow: false,
      canPayLater: true,
      suggestedTiming: 'before_service',
      reason: 'Paket serviste ödeme teslimat sırasında alınabilir'
    }
  }

  // Restoran siparişi için esnek ödeme
  return {
    mustPayNow: false,
    canPayLater: true,
    suggestedTiming: 'after_service',
    reason: 'Restoran siparişlerinde ödeme servis sonrası alınabilir'
  }
}

/**
 * Minimum ödeme tutarını hesaplar
 */
export function calculateMinimumPayment(order: Order): {
  minimumAmount: number
  requiresDeposit: boolean
  depositAmount?: number
  reason: string
} {
  // Paket servis için minimum tutarlar
  if (order.orderType === OrderType.DELIVERY) {
    const minimumDeliveryAmount = 50 // 50 TL minimum

    if (order.total < minimumDeliveryAmount) {
      return {
        minimumAmount: minimumDeliveryAmount,
        requiresDeposit: false,
        reason: `Paket servis için minimum sipariş tutarı ${minimumDeliveryAmount} TL`
      }
    }

    // Yüksek tutarlı siparişler için depozito
    if (order.total > 300) {
      return {
        minimumAmount: order.total,
        requiresDeposit: true,
        depositAmount: order.total * 0.5, // %50 depozito
        reason: 'Yüksek tutarlı siparişler için %50 depozito gerekli'
      }
    }
  }

  return {
    minimumAmount: order.total,
    requiresDeposit: false,
    reason: 'Standart ödeme'
  }
}

/**
 * Gelişmiş zaman tahmini - mutfak yoğunluğunu ve günün saatini hesaba katar
 */
export function getAdvancedPreparationTime(
  order: Order,
  currentHour: number = new Date().getHours(),
  kitchenLoad: number = 0.5 // 0-1 arası, 0.5 = orta yoğunluk
): {
  estimatedMinutes: number
  readyTime: Date
  factors: {
    baseTime: number
    orderTypeMultiplier: number
    priorityMultiplier: number
    hourMultiplier: number
    kitchenLoadMultiplier: number
  }
} {
  const baseTime = order.items.reduce((total, item) => {
    // Kategoriye göre farklı hazırlama süreleri
    const itemCategory = item.foodItem.category?.toLowerCase() || ''
    let itemTime = 4 // varsayılan 4 dakika

    if (itemCategory.includes('pizza')) itemTime = 15
    else if (itemCategory.includes('burger')) itemTime = 8
    else if (itemCategory.includes('salata')) itemTime = 3
    else if (itemCategory.includes('tatlı')) itemTime = 2
    else if (itemCategory.includes('içecek')) itemTime = 1
    else if (itemCategory.includes('et')) itemTime = 12
    else if (itemCategory.includes('tavuk')) itemTime = 10

    return total + (item.quantity * itemTime)
  }, 0)

  // Sipariş tipi çarpanı
  let orderTypeMultiplier = 1
  switch (order.orderType) {
    case OrderType.DINE_IN:
      orderTypeMultiplier = 1.2
      break
    case OrderType.TAKEAWAY:
      orderTypeMultiplier = 0.9
      break
    case OrderType.DELIVERY:
      orderTypeMultiplier = 1.1
      break
  }

  // Öncelik çarpanı
  let priorityMultiplier = 1
  switch (order.priority) {
    case OrderPriority.URGENT:
      priorityMultiplier = 0.7
      break
    case OrderPriority.HIGH:
      priorityMultiplier = 0.8
      break
    case OrderPriority.LOW:
      priorityMultiplier = 1.3
      break
  }

  // Günün saatine göre çarpan (yoğun saatlerde daha uzun)
  let hourMultiplier = 1
  if ((currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21)) {
    hourMultiplier = 1.4 // Öğle ve akşam yemeği saatleri
  } else if (currentHour >= 17 && currentHour <= 19) {
    hourMultiplier = 1.2 // Akşam öncesi
  } else if (currentHour >= 22 || currentHour <= 6) {
    hourMultiplier = 0.8 // Gece saatleri
  }

  // Mutfak yoğunluğu çarpanı
  const kitchenLoadMultiplier = 1 + (kitchenLoad * 0.8) // %0-80 ek süre

  const estimatedMinutes = Math.max(
    5,
    Math.round(baseTime * orderTypeMultiplier * priorityMultiplier * hourMultiplier * kitchenLoadMultiplier)
  )

  return {
    estimatedMinutes,
    readyTime: new Date(Date.now() + estimatedMinutes * 60000),
    factors: {
      baseTime,
      orderTypeMultiplier,
      priorityMultiplier,
      hourMultiplier,
      kitchenLoadMultiplier
    }
  }
}

/**
 * Teslimat süresi tahmini
 */
export function getDeliveryTimeEstimate(
  order: Order,
  distance: number = 5 // km cinsinden mesafe
): {
  preparationTime: number
  deliveryTime: number
  totalTime: number
  readyForDeliveryTime: Date
  estimatedDeliveryTime: Date
} {
  const preparation = getAdvancedPreparationTime(order)

  // Teslimat süresi hesaplama
  // Temel hız: 30 km/sa, trafik ve bekleme süresi: +50%
  const deliveryTimeMinutes = Math.round((distance / 30) * 60 * 1.5) + 10 // +10 dk hazırlanma

  const totalTime = preparation.estimatedMinutes + deliveryTimeMinutes
  const now = new Date()

  return {
    preparationTime: preparation.estimatedMinutes,
    deliveryTime: deliveryTimeMinutes,
    totalTime,
    readyForDeliveryTime: new Date(now.getTime() + preparation.estimatedMinutes * 60000),
    estimatedDeliveryTime: new Date(now.getTime() + totalTime * 60000)
  }
}

/**
 * Sipariş gecikmesi analizi
 */
export function analyzeOrderDelay(order: Order): {
  isDelayed: boolean
  delayMinutes: number
  delayReason: string
  suggestedAction: string
} {
  const now = new Date()

  if (!order.estimatedReadyTime) {
    return {
      isDelayed: false,
      delayMinutes: 0,
      delayReason: 'Tahmini süre belirlenmemiş',
      suggestedAction: 'Tahmini süre hesapla'
    }
  }

  const delayMilliseconds = now.getTime() - order.estimatedReadyTime.getTime()
  const delayMinutes = Math.floor(delayMilliseconds / 60000)

  if (delayMinutes <= 5) {
    return {
      isDelayed: false,
      delayMinutes: 0,
      delayReason: 'Zamanında',
      suggestedAction: 'Devam et'
    }
  }

  let delayReason = ''
  let suggestedAction = ''

  if (delayMinutes <= 15) {
    delayReason = 'Hafif gecikme - normal tolerans içinde'
    suggestedAction = 'Durumu izle'
  } else if (delayMinutes <= 30) {
    delayReason = 'Orta düzey gecikme'
    suggestedAction = 'Müşteriyi bilgilendir'
  } else {
    delayReason = 'Ciddi gecikme'
    suggestedAction = 'Öncelik ver ve müşteriyi ara'
  }

  return {
    isDelayed: true,
    delayMinutes,
    delayReason,
    suggestedAction
  }
}

/**
 * Dinamik fiyatlandırma önerisi (yoğun saatlerde)
 */
export function getDynamicPricingSuggestion(
  orderTime: Date,
  orderTotal: number
): {
  shouldApplyDynamicPricing: boolean
  suggestedMultiplier: number
  reason: string
  adjustedTotal?: number
} {
  const hour = orderTime.getHours()
  const dayOfWeek = orderTime.getDay() // 0 = Pazar, 6 = Cumartesi

  // Yoğun saatler ve günler
  const isPeakHour = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  if (isPeakHour && isWeekend) {
    return {
      shouldApplyDynamicPricing: true,
      suggestedMultiplier: 1.15,
      reason: 'Hafta sonu yoğun saatleri',
      adjustedTotal: orderTotal * 1.15
    }
  }

  if (isPeakHour) {
    return {
      shouldApplyDynamicPricing: true,
      suggestedMultiplier: 1.1,
      reason: 'Yoğun saatler',
      adjustedTotal: orderTotal * 1.1
    }
  }

  // Sakin saatlerde indirim
  if (hour >= 14 && hour <= 17) {
    return {
      shouldApplyDynamicPricing: true,
      suggestedMultiplier: 0.95,
      reason: 'Sakin saatler indirimi',
      adjustedTotal: orderTotal * 0.95
    }
  }

  return {
    shouldApplyDynamicPricing: false,
    suggestedMultiplier: 1,
    reason: 'Normal fiyatlandırma'
  }
}

/**
 * Gelişmiş mutfak iş akışı planlaması
 */
export function getKitchenWorkflowPlan(orders: Order[]): {
  priorityQueue: Order[]
  parallelGroups: Order[][]
  estimatedThroughputTime: number
  staffAssignments: {
    grill: Order[]
    prep: Order[]
    cold: Order[]
    finisher: Order[]
  }
  bottlenecks: {
    station: string
    expectedDelay: number
    suggestedAction: string
  }[]
} {
  // Aktif mutfak siparişlerini filtrele
  const activeOrders = orders.filter(order =>
    [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status)
  )

  // Öncelik sırasına göre sırala
  const priorityQueue = [...activeOrders].sort((a, b) => {
    const priorityOrder = {
      [OrderPriority.URGENT]: 4,
      [OrderPriority.HIGH]: 3,
      [OrderPriority.NORMAL]: 2,
      [OrderPriority.LOW]: 1
    }

    // Öncelik > Sipariş zamanı
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff

    return a.createdAt.getTime() - b.createdAt.getTime()
  })

  // İstasyonlara göre sipariş gruplandırması
  const staffAssignments = {
    grill: [] as Order[],
    prep: [] as Order[],
    cold: [] as Order[],
    finisher: [] as Order[]
  }

  priorityQueue.forEach(order => {
    const requiresGrill = order.items.some(item =>
      ['Et', 'Burger', 'Pizza'].some(cat => item.foodItem.category?.includes(cat))
    )
    const requiresPrep = order.items.some(item =>
      ['Salata', 'Aperatif', 'Meze'].some(cat => item.foodItem.category?.includes(cat))
    )
    const requiresCold = order.items.some(item =>
      ['İçecek', 'Tatlı', 'Dondurma'].some(cat => item.foodItem.category?.includes(cat))
    )

    if (requiresGrill) staffAssignments.grill.push(order)
    if (requiresPrep) staffAssignments.prep.push(order)
    if (requiresCold) staffAssignments.cold.push(order)
    staffAssignments.finisher.push(order) // Tüm siparişler finishtan geçer
  })

  // Paralel işlenebilecek sipariş grupları
  const parallelGroups: Order[][] = []
  let currentGroup: Order[] = []

  priorityQueue.forEach((order, index) => {
    if (index === 0 || currentGroup.length < 3) { // Maksimum 3 sipariş paralel
      currentGroup.push(order)
    } else {
      parallelGroups.push([...currentGroup])
      currentGroup = [order]
    }
  })

  if (currentGroup.length > 0) {
    parallelGroups.push(currentGroup)
  }

  // Darboğazları tespit et
  const bottlenecks: any[] = []
  const grillLoad = staffAssignments.grill.length
  const prepLoad = staffAssignments.prep.length
  const coldLoad = staffAssignments.cold.length

  if (grillLoad > 5) {
    bottlenecks.push({
      station: 'Izgara',
      expectedDelay: (grillLoad - 5) * 3, // Her fazla sipariş 3 dk gecikme
      suggestedAction: 'Ek izgara personeli atayın veya menüden et ürünlerini geçici olarak kaldırın'
    })
  }

  if (prepLoad > 8) {
    bottlenecks.push({
      station: 'Hazırlık',
      expectedDelay: (prepLoad - 8) * 2,
      suggestedAction: 'Hazır salata stokunu artırın veya ek hazırlık personeli atayın'
    })
  }

  // Toplam üretim süresi tahmini
  const estimatedThroughputTime = Math.max(
    grillLoad * 5,  // Izgara istasyonu
    prepLoad * 3,   // Hazırlık istasyonu
    coldLoad * 1    // Soğuk istasyon
  )

  return {
    priorityQueue,
    parallelGroups,
    estimatedThroughputTime,
    staffAssignments,
    bottlenecks
  }
}

/**
 * Mutfak istasyonu ataması
 */
export function assignKitchenStation(order: Order): {
  primaryStation: string
  secondaryStations: string[]
  estimatedStationTime: number
  requiredSkills: string[]
  equipmentNeeded: string[]
} {
  const stations: string[] = []
  const skills: string[] = []
  const equipment: string[] = []
  let estimatedTime = 0

  order.items.forEach(item => {
    const category = item.foodItem.category?.toLowerCase() || ''

    if (category.includes('pizza')) {
      stations.push('Fırın')
      skills.push('Pizza Yapımı')
      equipment.push('Pizza Fırını')
      estimatedTime = Math.max(estimatedTime, 15)
    }

    if (category.includes('burger') || category.includes('et')) {
      stations.push('Izgara')
      skills.push('Izgara Teknikleri')
      equipment.push('Izgara')
      estimatedTime = Math.max(estimatedTime, 8)
    }

    if (category.includes('salata')) {
      stations.push('Hazırlık')
      skills.push('Sebze Hazırlama')
      equipment.push('Hazırlık Tezgahı')
      estimatedTime = Math.max(estimatedTime, 3)
    }

    if (category.includes('tatlı')) {
      stations.push('Pastane')
      skills.push('Tatlı Yapımı')
      equipment.push('Mikser', 'Fırın')
      estimatedTime = Math.max(estimatedTime, 10)
    }
  })

  const uniqueStations = [...new Set(stations)]

  return {
    primaryStation: uniqueStations[0] || 'Genel',
    secondaryStations: uniqueStations.slice(1),
    estimatedStationTime: estimatedTime,
    requiredSkills: [...new Set(skills)],
    equipmentNeeded: [...new Set(equipment)]
  }
}

/**
 * Sipariş karmaşıklığı analizi
 */
export function analyzeOrderComplexity(order: Order): {
  complexityScore: number
  complexityLevel: 'Simple' | 'Medium' | 'Complex' | 'Very Complex'
  factors: {
    itemCount: number
    categoryDiversity: number
    specialInstructions: boolean
    cookingTechniques: number
    estimatedSteps: number
  }
  recommendations: string[]
} {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  const categories = new Set(order.items.map(item => item.foodItem.category))
  const categoryDiversity = categories.size

  const specialInstructions = !!order.notes || order.items.some(item => !!item.notes)

  const cookingTechniques = new Set()
  order.items.forEach(item => {
    const category = item.foodItem.category?.toLowerCase() || ''
    if (category.includes('pizza')) cookingTechniques.add('Fırın')
    if (category.includes('et')) cookingTechniques.add('Izgara')
    if (category.includes('tatlı')) cookingTechniques.add('Pastane')
    if (category.includes('içecek')) cookingTechniques.add('İçecek')
  })

  const estimatedSteps = itemCount + categoryDiversity + (specialInstructions ? 2 : 0)

  // Karmaşıklık puanı hesaplama
  let complexityScore = 0
  complexityScore += itemCount * 2  // Her ürün 2 puan
  complexityScore += categoryDiversity * 5  // Her kategori 5 puan
  complexityScore += specialInstructions ? 10 : 0  // Özel talimat 10 puan
  complexityScore += cookingTechniques.size * 3  // Her teknik 3 puan

  let complexityLevel: 'Simple' | 'Medium' | 'Complex' | 'Very Complex'
  if (complexityScore <= 15) complexityLevel = 'Simple'
  else if (complexityScore <= 30) complexityLevel = 'Medium'
  else if (complexityScore <= 50) complexityLevel = 'Complex'
  else complexityLevel = 'Very Complex'

  // Öneriler
  const recommendations: string[] = []
  if (itemCount > 5) recommendations.push('Çok ürünlü sipariş - ekstra dikkat gerekli')
  if (categoryDiversity > 3) recommendations.push('Farklı istasyonlar arası koordinasyon gerekli')
  if (specialInstructions) recommendations.push('Özel talimatları okuyun ve uygulayın')
  if (cookingTechniques.size > 2) recommendations.push('Çoklu teknik gerektiriyor - deneyimli personel atayin')

  return {
    complexityScore,
    complexityLevel,
    factors: {
      itemCount,
      categoryDiversity,
      specialInstructions,
      cookingTechniques: cookingTechniques.size,
      estimatedSteps
    },
    recommendations
  }
}

/**
 * Sipariş için atanmış personeli döndürür
 */
function getAssignedStaff(order: Order): string | undefined {
  // Bu fonksiyon daha sonra gerçek staff assignment sistemi ile entegre edilecek
  switch (order.status) {
    case OrderStatus.PREPARING:
      const complexity = analyzeOrderComplexity(order)
      const stationAssignment = assignKitchenStation(order)

      if (complexity.complexityLevel === 'Very Complex') {
        return `${stationAssignment.primaryStation} - Uzman Şef`
      } else if (complexity.complexityLevel === 'Complex') {
        return `${stationAssignment.primaryStation} - Deneyimli Aşçı`
      } else {
        return `${stationAssignment.primaryStation} - Aşçı`
      }
    case OrderStatus.READY_FOR_SERVICE:
    case OrderStatus.SERVED:
      return "Garson"
    case OrderStatus.OUT_FOR_DELIVERY:
      return order.courierId ? `Kurye ${order.courierId}` : "Kurye Atanacak"
    default:
      return undefined
  }
}

/**
 * Sipariş önceliğini otomatik belirler
 */
export function calculateOrderPriority(order: Order): OrderPriority {
  const now = new Date()
  const orderTime = new Date(order.createdAt)
  const minutesSinceOrder = (now.getTime() - orderTime.getTime()) / (1000 * 60)

  // Gecikmiş siparişler acil
  if (minutesSinceOrder > 45) return OrderPriority.URGENT
  if (minutesSinceOrder > 30) return OrderPriority.HIGH

  // Paket servis siparişleri yüksek öncelikli
  if (order.orderType === OrderType.DELIVERY) return OrderPriority.HIGH

  // Büyük siparişler normal öncelikli
  if (order.total > 200) return OrderPriority.HIGH

  return OrderPriority.NORMAL
}

/**
 * Sipariş durumu için renk döndürür (UI için)
 */
export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING_CONFIRMATION:
      return "bg-gray-100 text-gray-800 border-gray-200"
    case OrderStatus.CONFIRMED:
      return "bg-blue-100 text-blue-800 border-blue-200"
    case OrderStatus.PREPARING:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case OrderStatus.READY_FOR_PAYMENT:
      return "bg-purple-100 text-purple-800 border-purple-200"
    case OrderStatus.PAID:
      return "bg-green-100 text-green-800 border-green-200"
    case OrderStatus.READY_FOR_SERVICE:
      return "bg-orange-100 text-orange-800 border-orange-200"
    case OrderStatus.OUT_FOR_DELIVERY:
      return "bg-indigo-100 text-indigo-800 border-indigo-200"
    case OrderStatus.SERVED:
      return "bg-teal-100 text-teal-800 border-teal-200"
    case OrderStatus.COMPLETED:
      return "bg-green-100 text-green-800 border-green-200"
    case OrderStatus.CANCELLED:
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}