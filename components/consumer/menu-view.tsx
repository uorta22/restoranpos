"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Json } from "@/lib/database.types"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { ProductCard } from "@/components/consumer/product-card"
import {
  calculateCartTotals,
  translateOrderError,
  validateCheckout,
  type CheckoutFieldErrors,
} from "@/components/consumer/order-utils"
import type {
  CartLine,
  CashierPaymentMethod,
  OnlineOrderKind,
  PlaceOrderResult,
  PublicMenu,
  PublicProduct,
} from "@/components/consumer/types"

interface ConsumerMenuProps {
  menu: PublicMenu
}

interface PlacedState {
  orderId: string
  trackingToken: string | null
  totalAmount: number
  orderKind: OnlineOrderKind
}

const orderKindOptions: Array<{ id: OnlineOrderKind; label: string; icon: typeof Truck }> = [
  { id: "delivery", label: "Adrese teslim", icon: Truck },
  { id: "takeaway", label: "Gel-al", icon: Store },
]

const paymentOptions: Array<{ id: CashierPaymentMethod; label: string }> = [
  { id: "cash", label: "Kapıda nakit" },
  { id: "card", label: "Kapıda kart" },
]

export function ConsumerMenu({ menu }: ConsumerMenuProps) {
  const restaurant = menu.restaurant
  const categories = (menu.categories ?? []).filter((category) => (category.products ?? []).length > 0)
  const serviceModes = restaurant.service_modes ?? []
  const availableKinds = orderKindOptions.filter((option) => serviceModes.includes(option.id))
  const canOrder = availableKinds.length > 0

  const [lines, setLines] = useState<CartLine[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [orderKind, setOrderKind] = useState<OnlineOrderKind>(availableKinds[0]?.id ?? "delivery")
  const [paymentMethod, setPaymentMethod] = useState<CashierPaymentMethod>("cash")
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", email: "", notes: "" })
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placed, setPlaced] = useState<PlacedState | null>(null)

  const totals = useMemo(
    () => calculateCartTotals(lines, restaurant.tax_rate ?? 0),
    [lines, restaurant.tax_rate],
  )
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0)
  const quantitiesByProduct = useMemo(
    () => new Map(lines.map((line) => [line.product.id, line.quantity])),
    [lines],
  )

  const minOrderAmount = useMemo(() => {
    const zones = menu.delivery_zones ?? []
    if (orderKind !== "delivery" || !zones.length) return 0
    return Math.min(...zones.map((zone) => zone.min_order_amount ?? 0))
  }, [menu.delivery_zones, orderKind])

  const addProduct = (product: PublicProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [...current, { product, quantity: 1, notes: "" }]
    })
  }

  const changeQuantity = (productId: string, delta: number) => {
    setLines((current) =>
      current
        .map((line) => (line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line))
        .filter((line) => line.quantity > 0),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const errors = validateCheckout({
      orderKind,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      email: customer.email,
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (minOrderAmount > 0 && totals.total < minOrderAmount) {
      setSubmitError(`Bu restoranda adrese teslim için minimum sepet tutarı ${formatCurrency(minOrderAmount)}.`)
      return
    }

    setIsSubmitting(true)
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.rpc("place_public_order", {
      restaurant_slug: restaurant.slug,
      order_kind: orderKind,
      order_items: lines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
      })) as unknown as Json,
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      delivery_address:
        orderKind === "delivery" ? ({ text: customer.address.trim() } as unknown as Json) : undefined,
      order_notes: customer.notes.trim() || undefined,
      requested_payment_method: paymentMethod,
      customer_email: customer.email.trim() || undefined,
    })

    setIsSubmitting(false)
    if (error || !data) {
      setSubmitError(translateOrderError(error?.message ?? ""))
      return
    }

    const result = data as unknown as PlaceOrderResult
    setPlaced({
      orderId: result.order_id,
      trackingToken: result.tracking_token,
      totalAmount: result.total_amount,
      orderKind,
    })
    setLines([])
    setIsCartOpen(false)
  }

  if (placed) {
    return (
      <main className="grid min-h-screen place-items-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-600 text-white">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-gray-950">Siparişiniz alındı</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {restaurant.name} siparişinizi hazırlamaya başlıyor.
            {placed.orderKind === "takeaway" && " Hazır olduğunda gel-al noktasından teslim alabilirsiniz."}
          </p>
          <dl className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Sipariş no</dt>
              <dd className="font-medium text-gray-950">#{placed.orderId.slice(-6).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Toplam</dt>
              <dd className="font-semibold text-gray-950">{formatCurrency(placed.totalAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ödeme</dt>
              <dd className="text-gray-950">{paymentOptions.find((option) => option.id === paymentMethod)?.label}</dd>
            </div>
          </dl>
          {placed.trackingToken && (
            <Link
              href={`/track/${placed.trackingToken}`}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-orange-600 text-sm font-semibold text-white transition-colors hover:bg-orange-500"
            >
              Teslimatı takip et
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setPlaced(null)}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-full border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400"
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Menüye dön
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-600 text-white">
              <UtensilsCrossed className="h-7 w-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-gray-950 sm:text-2xl">{restaurant.name}</h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {restaurant.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="max-w-56 truncate sm:max-w-none">{restaurant.address}</span>
                  </span>
                )}
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:text-gray-950">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {restaurant.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {canOrder ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {availableKinds.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                >
                  <option.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {option.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Bu restoran şu anda online sipariş kabul etmiyor. Menüyü inceleyebilirsiniz.
            </p>
          )}
        </div>

        {categories.length > 1 && (
          <nav className="mx-auto max-w-3xl overflow-x-auto px-4 pb-3 sm:px-6" aria-label="Menü kategorileri">
            <div className="flex gap-2">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#kategori-${category.id}`}
                  className="shrink-0 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-orange-300 hover:text-orange-700"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Menü henüz hazırlanıyor.
          </p>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <section key={category.id} id={`kategori-${category.id}`} className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-gray-950">{category.name}</h2>
                {category.description && <p className="mt-1 text-sm text-gray-500">{category.description}</p>}
                <div className="mt-3 space-y-3">
                  {(category.products ?? []).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={quantitiesByProduct.get(product.id) ?? 0}
                      canOrder={canOrder}
                      onAdd={addProduct}
                      onChangeQuantity={changeQuantity}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {canOrder && itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-full bg-orange-600 px-5 py-3.5 text-white transition-colors hover:bg-orange-500"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    Sepeti onayla ({itemCount} ürün)
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(totals.total)}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl">
                <SheetHeader className="text-left">
                  <SheetTitle>Siparişi tamamla</SheetTitle>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="mt-4 space-y-5 pb-4">
                  <div className="space-y-2.5">
                    {lines.map((line) => (
                      <div key={line.product.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate text-gray-950">{line.product.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.product.id, -1)}
                            aria-label={`${line.product.name} adedini azalt`}
                            className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700"
                          >
                            −
                          </button>
                          <span className="min-w-5 text-center font-medium">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.product.id, 1)}
                            aria-label={`${line.product.name} adedini artır`}
                            className="grid h-7 w-7 place-items-center rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700"
                          >
                            +
                          </button>
                        </div>
                        <span className="w-20 text-right font-medium text-gray-950">
                          {formatCurrency(line.quantity * line.product.price * (1 - (line.product.discount_percent ?? 0) / 100))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {availableKinds.length > 1 && (
                    <fieldset>
                      <legend className="text-sm font-medium text-gray-950">Teslimat şekli</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {availableKinds.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setOrderKind(option.id)}
                            aria-pressed={orderKind === option.id}
                            className={cn(
                              "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                              orderKind === option.id
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-400",
                            )}
                          >
                            <option.icon className="h-4 w-4" aria-hidden="true" />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="consumer-name">Ad soyad</Label>
                      <Input
                        id="consumer-name"
                        value={customer.name}
                        onChange={(event) => setCustomer({ ...customer, name: event.target.value })}
                        autoComplete="name"
                        maxLength={120}
                        required
                      />
                      {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="consumer-phone">Telefon</Label>
                      <Input
                        id="consumer-phone"
                        type="tel"
                        value={customer.phone}
                        onChange={(event) => setCustomer({ ...customer, phone: event.target.value })}
                        autoComplete="tel"
                        maxLength={20}
                        required
                      />
                      {fieldErrors.phone && <p className="text-xs text-red-600">{fieldErrors.phone}</p>}
                    </div>
                  </div>

                  {orderKind === "delivery" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="consumer-address">Teslimat adresi</Label>
                      <Textarea
                        id="consumer-address"
                        value={customer.address}
                        onChange={(event) => setCustomer({ ...customer, address: event.target.value })}
                        autoComplete="street-address"
                        maxLength={400}
                        rows={2}
                        required
                      />
                      {fieldErrors.address && <p className="text-xs text-red-600">{fieldErrors.address}</p>}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="consumer-email">E-posta (isteğe bağlı)</Label>
                      <Input
                        id="consumer-email"
                        type="email"
                        value={customer.email}
                        onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
                        autoComplete="email"
                      />
                      {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ödeme</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setPaymentMethod(option.id)}
                            aria-pressed={paymentMethod === option.id}
                            className={cn(
                              "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                              paymentMethod === option.id
                                ? "border-orange-500 bg-orange-50 text-orange-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-400",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="consumer-notes">Sipariş notu (isteğe bağlı)</Label>
                    <Textarea
                      id="consumer-notes"
                      value={customer.notes}
                      onChange={(event) => setCustomer({ ...customer, notes: event.target.value })}
                      maxLength={400}
                      rows={2}
                    />
                  </div>

                  <dl className="space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <dt>Ara toplam</dt>
                      <dd>{formatCurrency(totals.subtotal)}</dd>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <dt>İndirim</dt>
                        <dd>−{formatCurrency(totals.discount)}</dd>
                      </div>
                    )}
                    {totals.tax > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <dt>Vergi</dt>
                        <dd>{formatCurrency(totals.tax)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold text-gray-950">
                      <dt>Toplam</dt>
                      <dd>{formatCurrency(totals.total)}</dd>
                    </div>
                    {minOrderAmount > 0 && totals.total < minOrderAmount && (
                      <p className="pt-1 text-xs text-amber-700">
                        Adrese teslim için minimum sepet tutarı {formatCurrency(minOrderAmount)}.
                      </p>
                    )}
                  </dl>

                  {submitError && (
                    <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {submitError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || lines.length === 0}
                    className="h-12 w-full rounded-full bg-orange-600 text-sm font-semibold hover:bg-orange-500"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Siparişi gönder · {formatCurrency(totals.total)}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </main>
  )
}
