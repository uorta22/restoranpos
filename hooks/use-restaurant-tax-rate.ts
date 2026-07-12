"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { getClientSupabaseInstance } from "@/lib/supabase"

export function useRestaurantTaxRate() {
  const { user } = useAuth()
  const [taxRate, setTaxRate] = useState(0)

  useEffect(() => {
    if (!user?.restaurant_id) return
    let active = true
    const supabase = getClientSupabaseInstance()
    void supabase
      .from("restaurants")
      .select("tax_rate")
      .eq("id", user.restaurant_id)
      .single()
      .then(({ data }) => {
        if (active && data) setTaxRate(data.tax_rate)
      })

    return () => {
      active = false
    }
  }, [user?.restaurant_id])

  return taxRate
}
