"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { FoodItem, CartItem } from "@/lib/types"

interface CartContextType {
  items: CartItem[]
  addItem: (item: FoodItem, quantity?: number, notes?: string) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateNotes: (id: string, notes: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  tableId: string | null
  tableName: string | null
  customerName: string | null
  setTableInfo: (id: string | null, name: string | null, customer: string | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [tableId, setTableId] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem("restaurant-cart")
    const savedTableId = localStorage.getItem("restaurant-table-id")
    const savedTableName = localStorage.getItem("restaurant-table-name")
    const savedCustomerName = localStorage.getItem("restaurant-customer-name")

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }

    if (savedTableId) setTableId(savedTableId)
    if (savedTableName) setTableName(savedTableName)
    if (savedCustomerName) setCustomerName(savedCustomerName)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("restaurant-cart", JSON.stringify(items))
  }, [items])

  // Save table info to localStorage whenever it changes
  useEffect(() => {
    if (tableId) localStorage.setItem("restaurant-table-id", tableId)
    else localStorage.removeItem("restaurant-table-id")

    if (tableName) localStorage.setItem("restaurant-table-name", tableName)
    else localStorage.removeItem("restaurant-table-name")

    if (customerName) localStorage.setItem("restaurant-customer-name", customerName)
    else localStorage.removeItem("restaurant-customer-name")
  }, [tableId, tableName, customerName])

  const addItem = (foodItem: FoodItem, quantity = 1, notes?: string) => {
    setItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex((item) => item.foodItem.id === foodItem.id)

      if (existingItemIndex !== -1) {
        // Update existing item
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          notes: notes || updatedItems[existingItemIndex].notes,
        }
        return updatedItems
      } else {
        // Add new item
        return [...prevItems, { id: uuidv4(), foodItem, quantity, notes }]
      }
    })
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.id !== id)
      }

      return prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    })
  }

  const updateNotes = (id: string, notes: string) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, notes } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const setTableInfo = (id: string | null, name: string | null, customer: string | null) => {
    setTableId(id)
    setTableName(name)
    setCustomerName(customer)
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const totalPrice = items.reduce((total, item) => total + item.foodItem.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        totalItems,
        totalPrice,
        tableId,
        tableName,
        customerName,
        setTableInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

// For backward compatibility
export const useCartContext = useCart
