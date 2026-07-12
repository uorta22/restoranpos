"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { notificationsApi, type AppNotification } from "@/lib/api"
import { getClientSupabaseInstance } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"

export type Notification = AppNotification

interface NotificationContextType {
  showNotification: (title: string, options?: NotificationOptions) => void
  requestPermission: () => Promise<NotificationPermission>
  notificationPermission: NotificationPermission | null
  notifications: Notification[]
  addNotification: (
    notification: Pick<Notification, "title" | "message" | "type"> & {
      targetUserId?: string
      relatedOrderId?: string
    },
  ) => Promise<Notification | null>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => Promise<void>
  clearNotifications: () => Promise<void>
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(() =>
    typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : null,
  )
  const [notifications, setNotifications] = useState<Notification[]>([])

  const refreshNotifications = useCallback(async () => {
    if (!user?.restaurant_id) {
      setNotifications([])
      return
    }
    try {
      setNotifications(await notificationsApi.getAll())
    } catch {
      setNotifications([])
    }
  }, [user?.restaurant_id])

  useEffect(() => {
    if (isAuthLoading) return
    const timeoutId = window.setTimeout(() => void refreshNotifications(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [isAuthLoading, refreshNotifications])

  useEffect(() => {
    if (!user?.restaurant_id || !user.id) return
    const supabase = getClientSupabaseInstance()
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void refreshNotifications(),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshNotifications, user?.id, user?.restaurant_id])

  const requestPermission = async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission
    try {
      const permission = await window.Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    } catch {
      return "denied" as NotificationPermission
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || notificationPermission !== "granted") return
    try {
      new window.Notification(title, options)
    } catch {
      // Some browsers expose the permission API without supporting the constructor.
    }
  }

  const addNotification: NotificationContextType["addNotification"] = async (notification) => {
    try {
      const created = await notificationsApi.create(notification)
      setNotifications((current) => [created, ...current])
      if (notificationPermission === "granted") {
        showNotification(notification.title, { body: notification.message })
      }
      return created
    } catch {
      return null
    }
  }

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id)
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead()
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = async (id: string) => {
    await notificationsApi.remove(id)
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }

  const clearNotifications = async () => {
    await notificationsApi.clear()
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        requestPermission,
        notificationPermission,
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
        unreadCount: notifications.filter((notification) => !notification.read).length,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotification must be used within a NotificationProvider")
  return context
}

export const useNotificationContext = useNotification
