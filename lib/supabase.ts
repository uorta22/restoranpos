import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://khivxbhqpuegzhsybrxr.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXZ4YmhxcHVlZ3poc3licnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzQ0ODMsImV4cCI6MjA3NjExMDQ4M30.0LDBSk1B67QQb9i1dChBqynsCamt6ZkXlsz-vLu6PKQ"

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side Supabase client (with service role key)
export const createServerSupabaseClient = () => {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoaXZ4YmhxcHVlZ3poc3licnhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUzNDQ4MywiZXhwIjoyMDc2MTEwNDgzfQ.SJD22QEV1JOhT-RkGgOPOi9E87vytzzcePyb-DAM4FQ"

  return createClient<Database>(supabaseUrl, serviceKey, {
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

  clientSupabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return clientSupabaseInstance
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== "https://dummy.supabase.co"
}
