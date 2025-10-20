// Demo Mode Configuration
export const isDemoMode = () => {
  // Check for demo mode flag in environment or localStorage
  return process.env.NODE_ENV === 'development' ||
         typeof window !== 'undefined' && window.localStorage.getItem('demo-mode') === 'true' ||
         !process.env.NEXT_PUBLIC_SUPABASE_URL ||
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export const enableDemoMode = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('demo-mode', 'true')
  }
}

export const disableDemoMode = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('demo-mode')
  }
}

// Simulate network delay for realistic feel
export const simulateNetworkDelay = async (min = 200, max = 800) => {
  const delay = Math.random() * (max - min) + min
  await new Promise(resolve => setTimeout(resolve, delay))
}

// Local storage keys for demo data persistence
export const DEMO_STORAGE_KEYS = {
  ORDERS: 'demo-orders',
  PRODUCTS: 'demo-products',
  TABLES: 'demo-tables',
  USERS: 'demo-users',
  COURIERS: 'demo-couriers',
  CATEGORIES: 'demo-categories',
  INVENTORY: 'demo-inventory',
  RESERVATIONS: 'demo-reservations',
  SUPPLIERS: 'demo-suppliers',
  CURRENT_USER: 'demo-current-user',
} as const

// Generic storage helpers
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
}

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return defaultValue
    }
  }
  return defaultValue
}

export const clearDemoData = () => {
  if (typeof window !== 'undefined') {
    Object.values(DEMO_STORAGE_KEYS).forEach(key => {
      window.localStorage.removeItem(key)
    })
  }
}

// Generate unique IDs
export const generateId = (prefix: string = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Demo notification helper
export const showDemoNotification = (message: string) => {
  console.log(`🎭 Demo Mode: ${message}`)

  // You can integrate with your toast system here
  if (typeof window !== 'undefined') {
    // Create a simple notification
    const notification = document.createElement('div')
    notification.textContent = `🎭 Demo: ${message}`
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #3b82f6;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}