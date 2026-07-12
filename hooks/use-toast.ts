"use client"

import { toast as sonnerToast } from "sonner"

export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function showToast({ title, description, variant = "default" }: ToastProps) {
  const message = title || description || "Bildirim"
  const id = variant === "destructive"
    ? sonnerToast.error(message, { description: title ? description : undefined })
    : sonnerToast(message, { description: title ? description : undefined })

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
  }
}

function dismissToast(toastId?: string | number) {
  sonnerToast.dismiss(toastId)
}

export function useToast() {
  return {
    toast: showToast,
    dismiss: dismissToast,
    toasts: [],
  }
}
