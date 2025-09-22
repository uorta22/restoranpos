"use client"

import type { FoodItem } from "@/lib/types"
import { formatCurrency, getDiscountedPrice } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"

interface FoodCardProps {
  food: FoodItem
}

export function FoodCard({ food }: FoodCardProps) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const discountedPrice = food.discount ? getDiscountedPrice(food) : food.price

  const handleAddToCart = () => {
    addItem(food)
    toast({
      title: "Ürün sepete eklendi",
      description: `${food.title} sepete eklendi.`,
    })
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="aspect-w-4 aspect-h-3 mb-3 overflow-hidden rounded-md">
          <img
            src={food.image || "/placeholder.svg?height=160&width=320"}
            alt={food.title}
            className="object-cover w-full h-full"
          />
        </div>
        <h3 className="font-medium text-lg">{food.title}</h3>
        <p className="text-sm text-gray-500">{food.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <div>
            {food.discount ? (
              <>
                <span className="text-sm line-through text-gray-400 mr-1">{formatCurrency(food.price)}</span>
                <span className="font-semibold">{formatCurrency(discountedPrice)}</span>
              </>
            ) : (
              <span className="font-semibold">{formatCurrency(food.price)}</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3">
        <Button className="w-full h-10" onClick={handleAddToCart}>
          Sepete Ekle
        </Button>
      </CardFooter>
    </Card>
  )
}
