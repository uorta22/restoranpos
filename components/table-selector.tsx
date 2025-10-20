"use client"

import { useState } from "react"
import { useTableContext } from "@/context/table-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface TableSelectorProps {
  onTableSelect: (tableId: string) => void
}

export function TableSelector({ onTableSelect }: TableSelectorProps) {
  const { tables } = useTableContext()
  const [activeTab, setActiveTab] = useState("main")

  // Masa bölümlerini al
  const mainTables = tables.filter((table) => table.section === "Ana Salon")
  const barTables = tables.filter((table) => table.section === "Bar")
  const terracesTables = tables.filter((table) => table.section === "Teras")

  const handleTableClick = (tableId: string) => {
    // Call the onTableSelect prop with the selected table ID
    onTableSelect(tableId)
  }

  return (
    <Tabs defaultValue="main" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="main">Ana Salon</TabsTrigger>
        <TabsTrigger value="bar">Bar</TabsTrigger>
        <TabsTrigger value="terrace">Teras</TabsTrigger>
      </TabsList>

      <TabsContent value="main" className="mt-0">
        <div className="grid grid-cols-3 gap-2">
          {mainTables.length > 0 ? (
            mainTables.map((table) => (
              <Button
                key={table.id}
                variant={table.status === "Dolu" ? "destructive" : "outline"}
                className="h-16 relative"
                disabled={table.status === "Dolu"}
                onClick={() => handleTableClick(table.id)}
              >
                {table.number}
                {table.status === "Dolu" && <Badge className="absolute -top-2 -right-2 bg-red-500">Dolu</Badge>}
              </Button>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500">Bu bölümde masa bulunmamaktadır.</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="bar" className="mt-0">
        <div className="grid grid-cols-3 gap-2">
          {barTables.length > 0 ? (
            barTables.map((table) => (
              <Button
                key={table.id}
                variant={table.status === "Dolu" ? "destructive" : "outline"}
                className="h-16 relative"
                disabled={table.status === "Dolu"}
                onClick={() => handleTableClick(table.id)}
              >
                {table.number}
                {table.status === "Dolu" && <Badge className="absolute -top-2 -right-2 bg-red-500">Dolu</Badge>}
              </Button>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500">Bu bölümde masa bulunmamaktadır.</div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="terrace" className="mt-0">
        <div className="grid grid-cols-3 gap-2">
          {terracesTables.length > 0 ? (
            terracesTables.map((table) => (
              <Button
                key={table.id}
                variant={table.status === "Dolu" ? "destructive" : "outline"}
                className="h-16 relative"
                disabled={table.status === "Dolu"}
                onClick={() => handleTableClick(table.id)}
              >
                {table.number}
                {table.status === "Dolu" && <Badge className="absolute -top-2 -right-2 bg-red-500">Dolu</Badge>}
              </Button>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500">Bu bölümde masa bulunmamaktadır.</div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
