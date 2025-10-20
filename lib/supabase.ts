import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Supabase URL ve anon key'i çevre değişkenlerinden alıyoruz
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Build zamanında environment variable'lar yoksa dummy değerler kullan
const buildTimeUrl = supabaseUrl || "https://dummy.supabase.co"
const buildTimeKey = supabaseAnonKey || "dummy-key"

// Supabase istemcisini oluşturuyoruz
export const supabase = createClient<Database>(buildTimeUrl, buildTimeKey)

// Server-side Supabase istemcisi (service role key ile)
export const createServerSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || buildTimeUrl
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || buildTimeKey

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Client-side Supabase istemcisi (singleton pattern)
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getClientSupabaseInstance = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  clientSupabaseInstance = createClient<Database>(buildTimeUrl, buildTimeKey)
  return clientSupabaseInstance
}

// Runtime'da environment variable'ları kontrol et
export const isSupabaseConfigured = () => {
  return (
    !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
