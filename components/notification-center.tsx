"use client"

import { useState } from "react"
import { Bell, Check, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useNotification } from "@/context/notification-context"

export function NotificationCenter() {
  const {
    notifications = [],
    unreadCount = 0,
    markAsRead = () => {},
    markAllAsRead = () => {},
    removeNotification = () => {},
    clearNotifications = () => {},
  } = useNotification()

  const [isOpen, setIsOpen] = useState(false)

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  const handleRemoveNotification = (id: string) => {
    removeNotification(id)
  }

  const formatTime = (date: Date) => {
    if (!date) return ""

    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()

    // Less than a minute
    if (diff < 60 * 1000) {
      return "Şimdi"
    }

    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      return `${minutes} dakika önce`
    }

    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000))
      return `${hours} saat önce`
    }

    // Format as date
    return new Date(date).toLocaleDateString()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Bildirimler</SheetTitle>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-1" />
                Tümünü Okundu İşaretle
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearNotifications}>
                <Trash2 className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Bildirim bulunmuyor</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-3 relative ${
                  !notification.read ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
                  </div>
                  <div className="flex space-x-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {!notification.read && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-lg" />}
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
