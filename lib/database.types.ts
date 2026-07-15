export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          is_active: boolean
          phone: string | null
          restaurant_id: string
          updated_at: string
          user_id: string
          vehicle_plate: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          phone?: string | null
          restaurant_id: string
          updated_at?: string
          user_id: string
          vehicle_plate?: string | null
          vehicle_type?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          is_active?: boolean
          phone?: string | null
          restaurant_id?: string
          updated_at?: string
          user_id?: string
          vehicle_plate?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_profiles_restaurant_id_user_id_fkey"
            columns: ["restaurant_id", "user_id"]
            isOneToOne: true
            referencedRelation: "restaurant_members"
            referencedColumns: ["restaurant_id", "user_id"]
          },
        ]
      }
      deliveries: {
        Row: {
          assigned_at: string | null
          courier_lat: number | null
          courier_lng: number | null
          courier_user_id: string | null
          created_at: string
          customer_lat: number | null
          customer_lng: number | null
          delivered_at: string | null
          estimated_delivery_at: string | null
          id: string
          order_id: string
          picked_up_at: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_enabled: boolean
          tracking_token: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          courier_lat?: number | null
          courier_lng?: number | null
          courier_user_id?: string | null
          created_at?: string
          customer_lat?: number | null
          customer_lng?: number | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          order_id: string
          picked_up_at?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_enabled?: boolean
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          courier_lat?: number | null
          courier_lng?: number | null
          courier_user_id?: string | null
          created_at?: string
          customer_lat?: number | null
          customer_lng?: number | null
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          order_id?: string
          picked_up_at?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_enabled?: boolean
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_restaurant_id_order_id_fkey"
            columns: ["restaurant_id", "order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          cost_price: number | null
          created_at: string
          current_stock: number
          id: string
          max_stock: number | null
          min_stock: number
          product_id: string
          restaurant_id: string
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          max_stock?: number | null
          min_stock?: number
          product_id: string
          restaurant_id: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          current_stock?: number
          id?: string
          max_stock?: number | null
          min_stock?: number
          product_id?: string
          restaurant_id?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_restaurant_id_product_id_fkey"
            columns: ["restaurant_id", "product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["restaurant_id", "id"]
          },
          {
            foreignKeyName: "inventory_items_restaurant_id_supplier_id_fkey"
            columns: ["restaurant_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          related_order_id: string | null
          restaurant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          related_order_id?: string | null
          restaurant_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          related_order_id?: string | null
          restaurant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_restaurant_id_related_order_id_fkey"
            columns: ["restaurant_id", "related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["restaurant_id", "id"]
          },
          {
            foreignKeyName: "notifications_restaurant_id_user_id_fkey"
            columns: ["restaurant_id", "user_id"]
            isOneToOne: false
            referencedRelation: "restaurant_members"
            referencedColumns: ["restaurant_id", "user_id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          acquisition_source: string | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          completed_at: string | null
          created_at: string
          current_step: Database["public"]["Enums"]["onboarding_step"]
          restaurant_id: string | null
          selected_plan_id: string
          table_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acquisition_source?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          completed_at?: string | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["onboarding_step"]
          restaurant_id?: string | null
          selected_plan_id?: string
          table_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acquisition_source?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          completed_at?: string | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["onboarding_step"]
          restaurant_id?: string | null
          selected_plan_id?: string
          table_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_sessions_selected_plan_id_fkey"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          line_total: number | null
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          restaurant_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number | null
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          restaurant_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          line_total?: number | null
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          restaurant_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_restaurant_id_order_id_fkey"
            columns: ["restaurant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["restaurant_id", "id"]
          },
          {
            foreignKeyName: "order_items_restaurant_id_product_id_fkey"
            columns: ["restaurant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: Json | null
          discount_amount: number
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          requested_payment_method:
            | Database["public"]["Enums"]["payment_method"]
            | null
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          tax_amount: number
          total_amount: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: Json | null
          discount_amount?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          requested_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          total_amount?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: Json | null
          discount_amount?: number
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          requested_payment_method?:
            | Database["public"]["Enums"]["payment_method"]
            | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          tax_amount?: number
          total_amount?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_table_id_fkey"
            columns: ["restaurant_id", "table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          processed_by: string | null
          reference: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          processed_by?: string | null
          reference?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          processed_by?: string | null
          reference?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_restaurant_id_order_id_fkey"
            columns: ["restaurant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          image_url: string | null
          is_available: boolean
          kind: Database["public"]["Enums"]["product_kind"]
          name: string
          price: number
          restaurant_id: string
          sku: string | null
          track_inventory: boolean
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          kind?: Database["public"]["Enums"]["product_kind"]
          name: string
          price: number
          restaurant_id: string
          sku?: string | null
          track_inventory?: boolean
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          image_url?: string | null
          is_available?: boolean
          kind?: Database["public"]["Enums"]["product_kind"]
          name?: string
          price?: number
          restaurant_id?: string
          sku?: string | null
          track_inventory?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_restaurant_id_category_id_fkey"
            columns: ["restaurant_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["restaurant_id", "id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          ends_at: string | null
          id: string
          notes: string | null
          party_size: number
          restaurant_id: string
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          party_size: number
          restaurant_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          ends_at?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          restaurant_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_table_id_fkey"
            columns: ["restaurant_id", "table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      restaurant_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          display_name: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          phone: string | null
          restaurant_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          token: string
          updated_at: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          phone?: string | null
          restaurant_id: string
          revoked_at?: string | null
          role: Database["public"]["Enums"]["member_role"]
          token?: string
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          phone?: string | null
          restaurant_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          updated_at?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invitations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          invited_by: string | null
          joined_at: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          restaurant_id: string
          role: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          joined_at?: string | null
          restaurant_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_subscriptions: {
        Row: {
          activated_at: string | null
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_ends_at: string | null
          plan_id: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_ends_at?: string | null
          plan_id: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_ends_at?: string | null
          plan_id?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string
          id: string
          number: string
          position_x: number | null
          position_y: number | null
          restaurant_id: string
          section: string | null
          status: Database["public"]["Enums"]["table_status"]
          updated_at: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          number: string
          position_x?: number | null
          position_y?: number | null
          restaurant_id: string
          section?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          number?: string
          position_x?: number | null
          position_y?: number | null
          restaurant_id?: string
          section?: string | null
          status?: Database["public"]["Enums"]["table_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          currency: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          phone: string | null
          service_modes: Database["public"]["Enums"]["order_type"][]
          slug: string
          tax_rate: number
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          phone?: string | null
          service_modes?: Database["public"]["Enums"]["order_type"][]
          slug: string
          tax_rate?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          service_modes?: Database["public"]["Enums"]["order_type"][]
          slug?: string
          tax_rate?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string
          order_id: string | null
          quantity: number
          reason: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id: string
          order_id?: string | null
          quantity: number
          reason?: string | null
          restaurant_id: string
          type: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string
          order_id?: string | null
          quantity?: number
          reason?: string | null
          restaurant_id?: string
          type?: Database["public"]["Enums"]["stock_movement_type"]
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_restaurant_id_inventory_item_id_fkey"
            columns: ["restaurant_id", "inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["restaurant_id", "id"]
          },
          {
            foreignKeyName: "stock_movements_restaurant_id_order_id_fkey"
            columns: ["restaurant_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["restaurant_id", "id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[]
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number
          trial_days: number
          trial_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[]
          id: string
          is_active?: boolean
          name: string
          price_monthly?: number
          price_yearly?: number
          trial_days?: number
          trial_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number
          trial_days?: number
          trial_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_sales: {
        Row: {
          average_order_value: number | null
          completed_orders: number | null
          restaurant_id: string | null
          sales_date: string | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_restaurant_invitation: {
        Args: { invitation_token: string }
        Returns: string
      }
      assign_delivery_courier: {
        Args: { target_courier_user_id: string; target_order_id: string }
        Returns: Database["public"]["Enums"]["delivery_status"]
      }
      create_courier_invitation: {
        Args: {
          courier_name: string
          courier_phone: string
          courier_vehicle_plate?: string
          courier_vehicle_type: string
          invite_email: string
          target_restaurant_id: string
        }
        Returns: string
      }
      create_order: {
        Args: {
          order_items: Json
          order_kind?: Database["public"]["Enums"]["order_type"]
          order_notes?: string
          pay_now?: boolean
          requested_payment_method?: Database["public"]["Enums"]["payment_method"]
          target_customer_name?: string
          target_customer_phone?: string
          target_delivery_address?: Json
          target_restaurant_id: string
          target_table_id?: string
        }
        Returns: string
      }
      create_restaurant: {
        Args: {
          restaurant_address?: string
          restaurant_email?: string
          restaurant_name: string
          restaurant_phone?: string
        }
        Returns: string
      }
      create_restaurant_from_onboarding: {
        Args: {
          restaurant_address?: string
          restaurant_currency?: string
          restaurant_email?: string
          restaurant_name: string
          restaurant_phone?: string
          restaurant_timezone?: string
        }
        Returns: string
      }
      create_restaurant_invitation: {
        Args: {
          invite_email: string
          invite_role: Database["public"]["Enums"]["member_role"]
          target_restaurant_id: string
        }
        Returns: string
      }
      get_delivery_tracking: {
        Args: { token: string }
        Returns: {
          courier_lat: number
          courier_lng: number
          customer_lat: number
          customer_lng: number
          estimated_delivery_at: string
          order_reference: string
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }[]
      }
      get_restaurant_invitation: {
        Args: { invitation_token: string }
        Returns: {
          email: string
          expires_at: string
          restaurant_name: string
          role: Database["public"]["Enums"]["member_role"]
        }[]
      }
      complete_onboarding: {
        Args: { starter_category_names?: string[] }
        Returns: string
      }
      record_order_payment: {
        Args: {
          payment_amount?: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_reference?: string
          target_order_id: string
        }
        Returns: Database["public"]["Enums"]["payment_status"]
      }
      save_onboarding_operations: {
        Args: {
          requested_table_count: number
          requested_tax_rate?: number
          selected_service_modes: Database["public"]["Enums"]["order_type"][]
        }
        Returns: Database["public"]["Tables"]["onboarding_sessions"]["Row"]
      }
      save_onboarding_plan: {
        Args: {
          requested_billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          requested_plan_id: string
        }
        Returns: Database["public"]["Tables"]["onboarding_sessions"]["Row"]
      }
      remove_restaurant_member: {
        Args: { target_restaurant_id: string; target_user_id: string }
        Returns: boolean
      }
      set_delivery_status: {
        Args: {
          current_lat?: number
          current_lng?: number
          next_status: Database["public"]["Enums"]["delivery_status"]
          target_order_id: string
        }
        Returns: Database["public"]["Enums"]["delivery_status"]
      }
      set_inventory_stock: {
        Args: {
          change_reason?: string
          new_stock: number
          target_product_id: string
        }
        Returns: number
      }
      set_order_status: {
        Args: {
          next_status: Database["public"]["Enums"]["order_status"]
          target_order_id: string
        }
        Returns: Database["public"]["Enums"]["order_status"]
      }
      set_restaurant_member_role: {
        Args: {
          next_role: Database["public"]["Enums"]["member_role"]
          target_restaurant_id: string
          target_user_id: string
        }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      start_onboarding: {
        Args: {
          acquisition_source?: string
          requested_billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          requested_plan_id?: string
        }
        Returns: Database["public"]["Tables"]["onboarding_sessions"]["Row"]
      }
    }
    Enums: {
      billing_cycle: "monthly" | "yearly"
      delivery_status:
        | "pending"
        | "assigned"
        | "en_route"
        | "delivered"
        | "cancelled"
      member_role:
        | "owner"
        | "manager"
        | "cashier"
        | "waiter"
        | "kitchen"
        | "courier"
      member_status: "invited" | "active" | "suspended"
      order_status:
        | "pending"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      onboarding_step:
        | "business"
        | "operations"
        | "plan"
        | "setup"
        | "complete"
      payment_method: "cash" | "card" | "online"
      payment_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "refunded"
        | "failed"
      product_kind: "meat" | "vegetarian" | "other"
      reservation_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      stock_movement_type:
        | "purchase"
        | "sale"
        | "adjustment"
        | "waste"
        | "return"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      table_status: "available" | "occupied" | "reserved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      billing_cycle: ["monthly", "yearly"],
      delivery_status: [
        "pending",
        "assigned",
        "en_route",
        "delivered",
        "cancelled",
      ],
      member_role: [
        "owner",
        "manager",
        "cashier",
        "waiter",
        "kitchen",
        "courier",
      ],
      member_status: ["invited", "active", "suspended"],
      order_status: ["pending", "preparing", "ready", "completed", "cancelled"],
      order_type: ["dine_in", "takeaway", "delivery"],
      onboarding_step: ["business", "operations", "plan", "setup", "complete"],
      payment_method: ["cash", "card", "online"],
      payment_status: [
        "pending",
        "partially_paid",
        "paid",
        "refunded",
        "failed",
      ],
      product_kind: ["meat", "vegetarian", "other"],
      reservation_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      stock_movement_type: [
        "purchase",
        "sale",
        "adjustment",
        "waste",
        "return",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      table_status: ["available", "occupied", "reserved"],
    },
  },
} as const

export type MemberRole = Database["public"]["Enums"]["member_role"]
export type MemberStatus = Database["public"]["Enums"]["member_status"]
export type ProductKind = Database["public"]["Enums"]["product_kind"]
export type TableStatus = Database["public"]["Enums"]["table_status"]
export type OrderType = Database["public"]["Enums"]["order_type"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type PaymentMethod = Database["public"]["Enums"]["payment_method"]
export type ReservationStatus = Database["public"]["Enums"]["reservation_status"]
export type StockMovementType = Database["public"]["Enums"]["stock_movement_type"]
export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"]
export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"]
export type BillingCycle = Database["public"]["Enums"]["billing_cycle"]
export type OnboardingStep = Database["public"]["Enums"]["onboarding_step"]
