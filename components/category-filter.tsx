"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Coffee, Soup, UtensilsCrossed, ChefHat, Sandwich, Search, Pizza, Salad, IceCream } from "lucide-react"
import { productsApi } from "@/lib/api"

interface CategoryFilterProps {
  onCategoryChange: (category: string) => void
}

// Icon mapping for categories
const iconMap: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="h-5 w-5" />,
  Soup: <Soup className="h-5 w-5" />,
  UtensilsCrossed: <UtensilsCrossed className="h-5 w-5" />,
  ChefHat: <ChefHat className="h-5 w-5" />,
  Sandwich: <Sandwich className="h-5 w-5" />,
  Pizza: <Pizza className="h-5 w-5" />,
  Salad: <Salad className="h-5 w-5" />,
  IceCream: <IceCream className="h-5 w-5" />,
}

export function CategoryFilter({ onCategoryChange }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState("Tümü")
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<Array<{ icon: string; label: string; items: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        // API'den ürünleri yükle ve kategorileri hesapla
        const products = await productsApi.getAll()

        // Kategorileri ve ürün sayılarını hesapla
        const categoryCount: Record<string, number> = {}
        products.forEach((product) => {
          categoryCount[product.category] = (categoryCount[product.category] || 0) + 1
        })

        // Kategori listesini oluştur
        const categoryList = Object.entries(categoryCount).map(([category, count]) => ({
          icon: "ChefHat", // Default icon, you can map specific icons per category
          label: category,
          items: count,
        }))

        // "Tümü" kategorisini başa ekle
        const allCategories = [
          {
            icon: "Search",
            label: "Tümü",
            items: products.length,
          },
          ...categoryList,
        ]

        setCategories(allCategories)
      } catch (error) {
        console.error("Failed to load categories:", error)
        // Fallback to empty categories
        setCategories([{ icon: "Search", label: "Tümü", items: 0 }])
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    onCategoryChange(category)
  }

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Kategoriler</h2>
          <Button variant="ghost" size="sm" disabled>
            <Search className="h-4 w-4 mr-1" />
            Ara
          </Button>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Kategoriler</h2>
        <Button variant="ghost" size="sm" onClick={() => setSearchVisible(!searchVisible)}>
          <Search className="h-4 w-4 mr-1" />
          Ara
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.label
            return (
              <Button
                key={category.label}
                variant={isSelected ? "default" : "outline"}
                className={`flex items-center px-4 py-2 ${isSelected ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                onClick={() => handleCategoryClick(category.label)}
              >
                {iconMap[category.icon] || <Search className="h-5 w-5" />}
                <span className="ml-2">{category.label}</span>
                <span className="ml-1 text-xs rounded-full bg-gray-100 text-gray-800 px-1.5 py-0.5">
                  {category.items}
                </span>
              </Button>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
