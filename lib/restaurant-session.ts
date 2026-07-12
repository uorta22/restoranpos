import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, MemberRole } from "@/lib/database.types"

export interface ActiveMembership {
  restaurantId: string
  role: MemberRole
}

export async function getActiveMembership(
  supabase: SupabaseClient<Database>,
  requestedRestaurantId?: string,
): Promise<ActiveMembership | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  let query = supabase
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .eq("status", "active")

  if (requestedRestaurantId) query = query.eq("restaurant_id", requestedRestaurantId)

  const { data, error } = await query.order("created_at", { ascending: true }).limit(1).maybeSingle()
  if (error) throw new Error(`Restoran üyeliği okunamadı: ${error.message}`)

  return data ? { restaurantId: data.restaurant_id, role: data.role } : null
}

export async function requireRestaurantId(
  supabase: SupabaseClient<Database>,
  requestedRestaurantId?: string,
): Promise<string> {
  const membership = await getActiveMembership(supabase, requestedRestaurantId)
  if (!membership) throw new Error("Bu kullanıcı için aktif restoran üyeliği bulunamadı")
  return membership.restaurantId
}
