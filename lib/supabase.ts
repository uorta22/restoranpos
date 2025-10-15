import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Supabase configuration - using new publishable keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://khivxbhqpuegzhsybrxr.supabase.co"
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_hTVlPjyLqZ44w-M1LaWqxQ_QG2jigXY"

// For backward compatibility with anon key
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXZ4YmhxcHVlZ3poc3licnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzQ0ODMsImV4cCI6MjA3NjExMDQ4M30.0LDBSk1B67QQb9i1dChBqynsCamt6ZkXlsz-vLu6PKQ"

// Use publishable key as the primary key (it works as both anon and service role)
const primaryKey = supabasePublishableKey || supabaseAnonKey

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, primaryKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Server-side Supabase client (with secret key)
export const createServerSupabaseClient = () => {
  const secretKey = process.env.SUPABASE_SECRET_KEY || "sb_secret_10Zmb9zQjID2fHAQ66RrZw_ZyqTXYh2"

  // For server operations, use secret key
  const serverKey = secretKey || supabasePublishableKey || supabaseAnonKey

  return createClient<Database>(supabaseUrl, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Client-side Supabase client (singleton pattern)
let clientSupabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const getClientSupabaseInstance = () => {
  if (clientSupabaseInstance) return clientSupabaseInstance

  clientSupabaseInstance = createClient<Database>(supabaseUrl, primaryKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return clientSupabaseInstance
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!primaryKey && supabaseUrl !== "https://dummy.supabase.co"
}
