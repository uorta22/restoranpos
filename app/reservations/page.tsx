"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SidebarNav } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Calendar, Clock, Users } from "lucide-react"
import { ReservationForm } from "@/components/reservation-form"
import { EmptyState } from "@/components/empty-state"
import { reservationsApi } from "@/lib/api"

interface Reservation {
  id: string
  customerName: string
  date: Date
  people: number
  tableNumber?: string
  phone: string
  notes?: string
  status: "Onaylandı" | "Beklemede" | "İptal"
}

export default function ReservationsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [showSidebar, setShowSidebar] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentReservation, setCurrentReservation] = useState({
    id: "",
    customerName: "",
    date: new Date(),
    time: "19:00",
    people: 2,
    tableNumber: "",
    phone: "",
    notes: "",
    status: "Beklemede" as const,
  })

  // Responsive sidebar kontrolü
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Rezervasyonları yükle
  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true)
        const data = await reservationsApi.getAll()
        setReservations(data)
      } catch (error) {
        console.error("Rezervasyonlar yüklenirken hata:", error)
        toast({
          title: "Hata",
          description: "Rezervasyonlar yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadReservations()
    }
  }, [user, toast])

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const handleAddReservation = () => {
    setCurrentReservation({
      id: "",
      customerName: "",
      date: new Date(),
      time: "19:00",
      people: 2,
      tableNumber: "",
      phone: "",
      notes: "",
      status: "Beklemede",
    })
    setIsDialogOpen(true)
  }

  const handleEditReservation = (id: string) => {
    const reservation = reservations.find((r) => r.id === id)
    if (reservation) {
      setCurrentReservation({
        ...reservation,
        time: new Intl.DateTimeFormat("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(reservation.date),
      })
      setIsDialogOpen(true)
    }
  }

  const handleDeleteReservation = async (id: string) => {
    try {
      const success = await reservationsApi.delete(id)
      if (success) {
        setReservations(reservations.filter((r) => r.id !== id))
        toast({
          title: "Rezervasyon silindi",
          description: "Rezervasyon başarıyla silindi.",
        })
      } else {
        throw new Error("Silme işlemi başarısız")
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rezervasyon silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const handleSaveReservation = async (reservationData: any) => {
    // Form validation
    if (!reservationData.customerName || !reservationData.phone) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen müşteri adı ve telefon numarası alanlarını doldurun.",
        variant: "destructive",
      })
      return
    }

    try {
      if (reservationData.id) {
        // Mevcut rezervasyonu güncelle
        const updated = await reservationsApi.update(reservationData.id, reservationData)
        if (updated) {
          setReservations(reservations.map((r) => (r.id === reservationData.id ? updated : r)))
          toast({
            title: "Rezervasyon güncellendi",
            description: "Rezervasyon bilgileri başarıyla güncellendi.",
          })
        } else {
          throw new Error("Güncelleme başarısız")
        }
      } else {
        // Yeni rezervasyon ekle
        const newReservation = await reservationsApi.create(reservationData)
        if (newReservation) {
          setReservations([...reservations, newReservation])
          toast({
            title: "Rezervasyon eklendi",
            description: "Yeni rezervasyon başarıyla eklendi.",
          })
        } else {
          throw new Error("Ekleme başarısız")
        }
      }

      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Hata",
        description: "Rezervasyon kaydedilirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <SidebarNav />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showMobileMenu={!showSidebar} onMenuToggle={() => setShowSidebar(!showSidebar)} />
        <div className="flex-1 overflow-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Rezervasyonlar</h1>
            <Button onClick={handleAddReservation}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Rezervasyon
            </Button>
          </div>

          {reservations.length === 0 ? (
            <EmptyState
              type="orders"
              title="Henüz rezervasyon yok"
              description="İlk rezervasyonunuzu ekleyerek müşteri rezervasyonlarını yönetmeye başlayın."
              onAction={handleAddReservation}
              actionLabel="İlk Rezervasyonu Ekle"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{reservation.customerName}</CardTitle>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          reservation.status === "Onaylandı"
                            ? "bg-green-100 text-green-800"
                            : reservation.status === "Beklemede"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {reservation.status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      {formatDate(new Date(reservation.date))}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      {formatTime(new Date(reservation.date))}
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="mr-2 h-4 w-4 text-gray-500" />
                      {reservation.people} kişi
                    </div>
                    {reservation.tableNumber && (
                      <div className="text-sm">
                        <span className="font-medium">Masa:</span> {reservation.tableNumber}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="font-medium">Telefon:</span> {reservation.phone}
                    </div>
                    {reservation.notes && (
                      <div className="text-sm">
                        <span className="font-medium">Notlar:</span> {reservation.notes}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditReservation(reservation.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteReservation(reservation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReservationForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={currentReservation}
        onSave={handleSaveReservation}
      />
    </div>
  )
}
