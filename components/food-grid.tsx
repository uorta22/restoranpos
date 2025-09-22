"use client"

import { useState, useEffect } from "react"
import { FoodCard } from "@/components/food-card"
import type { FoodItem } from "@/lib/types"
import { Search } from "lucide-react"
import { productsApi } from "@/lib/api"

interface FoodGridProps {
  category: string
  searchQuery?: string
}

export function FoodGrid({ category, searchQuery = "" }: FoodGridProps) {
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        // API'den ürünleri yükle
        const allProducts = await productsApi.getAll()

        let filtered = [...allProducts]

        // Filter by category
        if (category !== "Tümü") {
          filtered = filtered.filter((item) => item.category === category)
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              (item.description && item.description.toLowerCase().includes(query)),
          )
        }

        setFilteredItems(filtered)
      } catch (error) {
        console.error("Failed to load products:", error)
        setFilteredItems([])
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [category, searchQuery])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Sonuç bulunamadı</h3>
        <p className="text-gray-500">Farklı bir kategori veya arama terimi deneyin</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredItems.map((food) => (
        <FoodCard key={food.id} food={food} />
      ))}
    </div>
  )
}
