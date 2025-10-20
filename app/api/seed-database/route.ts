import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Demo kullanıcıları oluştur
    const passwordHash = await bcrypt.hash("password123", 10)

    // Admin kullanıcısı
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .insert({
        email: "admin@example.com",
        password_hash: passwordHash,
        full_name: "Admin User",
        role: "Yönetici",
        email_verified: true,
      })
      .select()
      .single()

    if (adminError) throw adminError

    // Restoran oluştur
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .insert({
        owner_id: adminUser.id,
        name: "Demo Restaurant",
        address: "İstanbul, Kadıköy",
        phone: "0555-123-4567",
        email: "info@demorestaurant.com",
      })
      .select()
      .single()

    if (restaurantError) throw restaurantError

    // Kategoriler oluştur
    const categories = [
      { name: "İçecekler", icon: "Coffee", restaurant_id: restaurant.id },
      { name: "Çorbalar", icon: "Soup", restaurant_id: restaurant.id },
      { name: "Ana Yemekler", icon: "UtensilsCrossed", restaurant_id: restaurant.id },
      { name: "Tatlılar", icon: "IceCream", restaurant_id: restaurant.id },
    ]

    const { data: categoryData, error: categoryError } = await supabase.from("categories").insert(categories).select()

    if (categoryError) throw categoryError

    // Ürünler oluştur
    const products = [
      {
        restaurant_id: restaurant.id,
        category_id: categoryData[0].id, // İçecekler
        name: "Türk Kahvesi",
        description: "Geleneksel Türk kahvesi",
        price: 25.0,
        is_available: true,
        type: "Vejeteryan",
      },
      {
        restaurant_id: restaurant.id,
        category_id: categoryData[1].id, // Çorbalar
        name: "Mercimek Çorbası",
        description: "Geleneksel tarif ile hazırlanan kırmızı mercimek çorbası",
        price: 35.0,
        is_available: true,
        type: "Vejeteryan",
      },
      {
        restaurant_id: restaurant.id,
        category_id: categoryData[2].id, // Ana Yemekler
        name: "Karışık Izgara",
        description: "Kuzu pirzola, köfte, tavuk şiş ve dana antrikot ile hazırlanan özel ızgara tabağı",
        price: 180.0,
        is_available: true,
        type: "Et",
      },
    ]

    const { error: productError } = await supabase.from("products").insert(products)

    if (productError) throw productError

    // Masalar oluştur
    const tables = [
      { restaurant_id: restaurant.id, number: "M1", capacity: 2, section: "Ana Salon" },
      { restaurant_id: restaurant.id, number: "M2", capacity: 4, section: "Ana Salon" },
      { restaurant_id: restaurant.id, number: "M3", capacity: 6, section: "Ana Salon" },
      { restaurant_id: restaurant.id, number: "B1", capacity: 2, section: "Bar" },
      { restaurant_id: restaurant.id, number: "T1", capacity: 4, section: "Teras" },
    ]

    const { error: tableError } = await supabase.from("tables").insert(tables)

    if (tableError) throw tableError

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      admin: { email: "admin@example.com", password: "password123" },
    })
  } catch (error) {
    console.error("Database seeding error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
