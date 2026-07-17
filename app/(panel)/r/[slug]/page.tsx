import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConsumerMenu } from "@/components/consumer/menu-view"
import type { PublicMenu } from "@/components/consumer/types"

interface ConsumerPageProps {
  params: Promise<{ slug: string }>
}

async function fetchPublicMenu(slug: string): Promise<PublicMenu | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_public_menu", { restaurant_slug: slug })
  if (error || !data) return null
  return data as unknown as PublicMenu
}

export async function generateMetadata({ params }: ConsumerPageProps): Promise<Metadata> {
  const { slug } = await params
  const menu = await fetchPublicMenu(slug)
  if (!menu) return { title: "Restoran bulunamadı" }
  return {
    title: `${menu.restaurant.name} | Online Sipariş`,
    description: `${menu.restaurant.name} menüsünden online sipariş verin.`,
  }
}

export default async function ConsumerOrderPage({ params }: ConsumerPageProps) {
  const { slug } = await params
  const menu = await fetchPublicMenu(slug)
  if (!menu?.restaurant) notFound()

  return <ConsumerMenu menu={menu} />
}
