"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { generateId } from "@/lib/demo-mode"

// Notification type definition
export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: Date
}

interface NotificationContextType {
  // Browser notification functions
  showNotification: (title: string, options?: NotificationOptions) => void
  requestPermission: () => Promise<NotificationPermission>
  notificationPermission: NotificationPermission | null

  // App notification functions
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "read" | "timestamp">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  unreadCount: number
}

const defaultContext: NotificationContextType = {
  showNotification: () => {},
  requestPermission: async () => "default",
  notificationPermission: null,
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
  unreadCount: 0,
}

const NotificationContext = createContext<NotificationContextType>(defaultContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied" as NotificationPermission
    }

    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      return permission
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return "denied" as NotificationPermission
    }
  }

  // Show browser notification
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window === "undefined" || !("Notification" in window) || notificationPermission !== "granted") {
      return
    }

    try {
      new Notification(title, options)
    } catch (error) {
      console.error("Error showing notification:", error)
    }
  }

  // Add notification to the app
  const addNotification = (notification: Omit<Notification, "id" | "read" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId('notification'),
      read: false,
      timestamp: new Date(),
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Also show browser notification if permission granted
    if (notificationPermission === "granted") {
      showNotification(notification.title, { body: notification.message })
    }
  }

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([])
  }

  // Calculate unread count
  const unreadCount = notifications.filter((notification) => !notification.read).length

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
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}

// For backward compatibility
export const useNotificationContext = useNotification
