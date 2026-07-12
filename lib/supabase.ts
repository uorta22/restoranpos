import { createClient } from "@/lib/supabase/client"

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

export const getClientSupabaseInstance = () => createClient()
