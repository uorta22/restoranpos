"use client"

import { Leaf, Minus, Plus } from "lucide-react"
import { ProductImage } from "@/components/product-image"
import { formatCurrency } from "@/lib/utils"
import { getUnitPrice } from "@/components/consumer/order-utils"
import type { PublicProduct } from "@/components/consumer/types"

interface ProductCardProps {
  product: PublicProduct
  quantity: number
  canOrder: boolean
  onAdd: (product: PublicProduct) => void
  onChangeQuantity: (productId: string, delta: number) => void
}

export function ProductCard({ product, quantity, canOrder, onAdd, onChangeQuantity }: ProductCardProps) {
  const discountPercent = product.discount_percent ?? 0
  const hasDiscount = discountPercent > 0
  const unitPrice = getUnitPrice(product)

  return (
    <article className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-gray-950">{product.name}</h3>
          {product.kind === "vegetarian" && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              <Leaf className="h-3 w-3" aria-hidden="true" />
              Vejetaryen
            </span>
          )}
        </div>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>}
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
          )}
          <span className="font-semibold text-gray-950">{formatCurrency(unitPrice)}</span>
          {hasDiscount && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              %{discountPercent} indirim
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <ProductImage
          src={product.image_url ?? undefined}
          alt={product.name}
          className="h-20 w-20 rounded-xl border border-gray-100 object-cover"
        />
        {canOrder &&
          (quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ekle
            </button>
          ) : (
            <div className="flex items-center rounded-full border border-orange-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => onChangeQuantity(product.id, -1)}
                aria-label={`${product.name} adedini azalt`}
                className="grid h-8 w-8 place-items-center rounded-full text-orange-600 transition-colors hover:bg-orange-50"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-5 text-center text-sm font-semibold text-gray-950" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(product.id, 1)}
                aria-label={`${product.name} adedini artır`}
                className="grid h-8 w-8 place-items-center rounded-full text-orange-600 transition-colors hover:bg-orange-50"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
      </div>
    </article>
  )
}
