"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { tablesApi } from "@/lib/api"
import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Table } from "@/lib/types"
import { useAuth } from "@/context/auth-context"

interface TableContextType {
  tables: Table[]
  isLoading: boolean
  getTableById: (id: string) => Table | undefined
  getTablesBySection: (section: string) => Table[]
  updateTableStatus: (id: string, status: Table["status"], customer?: string) => Promise<void>
  clearTable: (id: string) => Promise<void>
  assignOrderToTable: (tableId: string, orderId: string) => Promise<void>
  addTable: (number: string, capacity: number, section: string) => Promise<Table | null>
  updateTable: (id: string, data: Partial<Table>) => Promise<Table | null>
  deleteTable: (id: string) => Promise<void>
  getAvailableTables: () => Table[]
  refreshTables: () => Promise<void>
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshTables = useCallback(async () => {
    if (!user?.restaurant_id) {
      setTables([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      setTables(await tablesApi.getAll(user.restaurant_id))
    } finally {
      setIsLoading(false)
    }
  }, [user?.restaurant_id])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void refreshTables(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, refreshTables])

  useEffect(() => {
    if (!user?.restaurant_id) return
    const supabase = getClientSupabaseInstance()
    const refresh = () => void refreshTables()
    const channel = supabase
      .channel(`tables:${user.restaurant_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `restaurant_id=eq.${user.restaurant_id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${user.restaurant_id}`,
        },
        refresh,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshTables, user?.restaurant_id])

  const getTableById = (id: string) => tables.find((table) => table.id === id)
  const getAvailableTables = () => tables.filter((table) => table.status === "Müsait")
  const getTablesBySection = (section: string) => tables.filter((table) => table.section === section)

  const updateTableStatus = async (id: string, status: Table["status"], customer?: string) => {
    const previous = tables
    setTables((current) =>
      current.map((table) =>
        table.id === id ? { ...table, status, customer: customer || undefined } : table,
      ),
    )
    try {
      await tablesApi.update(id, { status })
    } catch (error) {
      setTables(previous)
      throw error
    }
  }

  const clearTable = async (id: string) => {
    const previous = tables
    setTables((current) =>
      current.map((table) =>
        table.id === id
          ? { ...table, status: "Müsait", customer: undefined, currentOrderId: undefined }
          : table,
      ),
    )
    try {
      await tablesApi.update(id, { status: "Müsait" })
    } catch (error) {
      setTables(previous)
      throw error
    }
  }

  const assignOrderToTable = async (tableId: string, orderId: string) => {
    setTables((current) =>
      current.map((table) =>
        table.id === tableId ? { ...table, status: "Dolu", currentOrderId: orderId } : table,
      ),
    )
    await tablesApi.update(tableId, { status: "Dolu" })
  }

  const addTable = async (number: string, capacity: number, section: string) => {
    const created = await tablesApi.create({ number, capacity, section })
    if (created) setTables((current) => [...current, created])
    return created
  }

  const updateTable = async (id: string, data: Partial<Table>) => {
    const updated = await tablesApi.update(id, data)
    if (updated) setTables((current) => current.map((table) => (table.id === id ? updated : table)))
    return updated
  }

  const deleteTable = async (id: string) => {
    const table = getTableById(id)
    if (table?.status === "Dolu") throw new Error("Dolu masa silinemez")
    await tablesApi.delete(id)
    setTables((current) => current.filter((item) => item.id !== id))
  }

  return (
    <TableContext.Provider
      value={{
        tables,
        isLoading,
        getTableById,
        getTablesBySection,
        updateTableStatus,
        clearTable,
        assignOrderToTable,
        addTable,
        updateTable,
        deleteTable,
        getAvailableTables,
        refreshTables,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}

export function useTableContext() {
  const context = useContext(TableContext)
  if (context === undefined) throw new Error("useTableContext must be used within a TableProvider")
  return context
}
