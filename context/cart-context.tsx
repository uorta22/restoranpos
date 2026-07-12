"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { CartItem, FoodItem } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { calculateOrderTotals } from "@/lib/utils"

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

interface CartSnapshot {
  items: CartItem[]
  tableId: string | null
  tableName: string | null
  customerName: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function isCartSnapshot(value: unknown): value is CartSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const snapshot = value as Partial<CartSnapshot>
  return Array.isArray(snapshot.items)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [tableId, setTableId] = useState<string | null>(null)
  const [tableName, setTableName] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [storageKey, setStorageKey] = useState<string | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!user?.restaurant_id) {
        setItems([])
        setTableId(null)
        setTableName(null)
        setCustomerName(null)
        setStorageKey(null)
        return
      }

      const nextStorageKey = `restaurant-cart:${user.restaurant_id}:${user.id}`
      const savedCart = sessionStorage.getItem(nextStorageKey)
      if (savedCart) {
        try {
          const parsed: unknown = JSON.parse(savedCart)
          if (isCartSnapshot(parsed)) {
            setItems(parsed.items)
            setTableId(parsed.tableId ?? null)
            setTableName(parsed.tableName ?? null)
            setCustomerName(parsed.customerName ?? null)
          }
        } catch {
          sessionStorage.removeItem(nextStorageKey)
        }
      } else {
        setItems([])
        setTableId(null)
        setTableName(null)
        setCustomerName(null)
      }
      setStorageKey(nextStorageKey)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [user?.id, user?.restaurant_id])

  useEffect(() => {
    if (!storageKey) return
    const snapshot: CartSnapshot = { items, tableId, tableName, customerName }
    sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
  }, [customerName, items, storageKey, tableId, tableName])

  const addItem = (foodItem: FoodItem, quantity = 1, notes?: string) => {
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.foodItem.id === foodItem.id)
      if (existingIndex === -1) {
        return [...current, { id: crypto.randomUUID(), foodItem, quantity, notes }]
      }

      return current.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
          : item,
      )
    })
  }

  const removeItem = (id: string) => setItems((current) => current.filter((item) => item.id !== id))

  const updateQuantity = (id: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )
  }

  const updateNotes = (id: string, notes: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, notes } : item)))
  }

  const clearCart = () => setItems([])

  const setTableInfo = (id: string | null, name: string | null, customer: string | null) => {
    setTableId(id)
    setTableName(name)
    setCustomerName(customer)
  }

  const cartTotals = calculateOrderTotals(items, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        totalItems: items.reduce((total, item) => total + item.quantity, 0),
        totalPrice: cartTotals.netSubtotal,
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

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) throw new Error("useCart must be used within a CartProvider")
  return context
}

export const useCartContext = useCart
