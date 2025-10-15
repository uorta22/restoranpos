import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Supabase configuration - using the new project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vocytrfqfecslblonpdd.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3l0cmZxZmVjc2xibG9ucGRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MzU5MDIsImV4cCI6MjA3NjExMTkwMn0.jQifEryB4xLnR1d-eczWv2BmjYNbNfRfNHFmZ4AcH3U"

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Server-side Supabase client (with service role key)
export const createServerSupabaseClient = () => {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3l0cmZxZmVjc2xibG9ucGRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUzNTkwMiwiZXhwIjoyMDc2MTExOTAyfQ.4HmB5L_SmHaaVVVi3JHZCoMLWlNnEx-aHZ3efjamERI"

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
      detectSessionInUrl: true,
    },
  })

  return clientSupabaseInstance
}

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== "https://dummy.supabase.co"
}
