"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { generateId } from "@/lib/demo-mode"
import type { Table } from "@/lib/types"

interface TableContextType {
  tables: Table[]
  getTableById: (id: string) => Table | undefined
  getTablesBySection: (section: string) => Table[]
  updateTableStatus: (id: string, status: "Müsait" | "Dolu" | "Rezerve", customer?: string) => void
  clearTable: (id: string) => void
  assignOrderToTable: (tableId: string, orderId: string) => void
  addTable: (number: string, capacity: number, section: string) => void
  updateTable: (id: string, data: Partial<Table>) => void
  deleteTable: (id: string) => void
  getAvailableTables: () => Table[]
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Table[]>([])

  // Load tables from localStorage on mount (fallback for development)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTables = localStorage.getItem("restaurant-tables")
      if (savedTables) {
        setTables(JSON.parse(savedTables))
      } else {
        // Initialize with sample tables if none exist
        const sampleTables = [
          {
            id: "table-1",
            number: "M1",
            capacity: 4,
            status: "Müsait",
            section: "Ana Salon",
          },
          {
            id: "table-2",
            number: "B1",
            capacity: 2,
            status: "Müsait",
            section: "Bar",
          },
          {
            id: "table-3",
            number: "T1",
            capacity: 6,
            status: "Müsait",
            section: "Teras",
          }
        ]
        setTables(sampleTables)
      }
    }
  }, [])

  // Save tables to localStorage whenever tables change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("restaurant-tables", JSON.stringify(tables))
    }
  }, [tables])

  const getTableById = (id: string) => {
    return tables.find((table) => table.id === id)
  }

  const getAvailableTables = () => {
    return tables.filter((table) => table.status === "Müsait")
  }

  const getTablesBySection = (section: string) => {
    return tables.filter((table) => table.section === section)
  }

  const updateTableStatus = (id: string, status: "Müsait" | "Dolu" | "Rezerve", customer?: string) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              status,
              customer: customer || undefined,
            }
          : table,
      ),
    )
  }

  const clearTable = (id: string) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              status: "Müsait",
              customer: undefined,
              currentOrderId: undefined,
            }
          : table,
      ),
    )
  }

  const assignOrderToTable = (tableId: string, orderId: string) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: "Dolu",
              currentOrderId: orderId,
            }
          : table,
      ),
    )
  }

  const addTable = (number: string, capacity: number, section: string) => {
    const newTable: Table = {
      id: generateId('table'),
      number,
      capacity,
      status: "Müsait",
      section,
    }

    setTables((prevTables) => [...prevTables, newTable])
  }

  const updateTable = (id: string, data: Partial<Table>) => {
    setTables((prevTables) =>
      prevTables.map((table) =>
        table.id === id
          ? {
              ...table,
              ...data,
            }
          : table,
      ),
    )
  }

  const deleteTable = (id: string) => {
    // Dolu masayı silmeyi engelle
    const table = getTableById(id)
    if (table && table.status === "Dolu") {
      throw new Error("Dolu masa silinemez")
    }

    setTables((prevTables) => prevTables.filter((table) => table.id !== id))
  }

  return (
    <TableContext.Provider
      value={{
        tables,
        getTableById,
        getTablesBySection,
        updateTableStatus,
        clearTable,
        assignOrderToTable,
        addTable,
        updateTable,
        deleteTable,
        getAvailableTables,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}

export const useTableContext = () => {
  const context = useContext(TableContext)
  if (context === undefined) {
    throw new Error("useTableContext must be used within a TableProvider")
  }
  return context
}
