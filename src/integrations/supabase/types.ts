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
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_login_history: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          show_on_home: boolean
          slug: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_on_home?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_on_home?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          discount_paise: number
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_paise?: number
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_paise?: number
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          first_order_only: boolean
          id: string
          max_discount_paise: number | null
          min_order_paise: number
          per_user_limit: number
          total_usage_limit: number
          updated_at: string
          usage_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value?: number
          first_order_only?: boolean
          id?: string
          max_discount_paise?: number | null
          min_order_paise?: number
          per_user_limit?: number
          total_usage_limit?: number
          updated_at?: string
          usage_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean
          id?: string
          max_discount_paise?: number | null
          min_order_paise?: number
          per_user_limit?: number
          total_usage_limit?: number
          updated_at?: string
          usage_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      delivery_rules: {
        Row: {
          active: boolean
          base_charge_paise: number
          cod_available: boolean
          created_at: string
          estimated_days_max: number
          estimated_days_min: number
          express_available: boolean
          express_charge_paise: number
          free_shipping_threshold_paise: number
          id: string
          pincode_prefix: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_charge_paise?: number
          cod_available?: boolean
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          express_available?: boolean
          express_charge_paise?: number
          free_shipping_threshold_paise?: number
          id?: string
          pincode_prefix?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_charge_paise?: number
          cod_available?: boolean
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          express_available?: boolean
          express_charge_paise?: number
          free_shipping_threshold_paise?: number
          id?: string
          pincode_prefix?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      empty_gift_boxes: {
        Row: {
          allowed_category_ids: string[]
          allowed_product_ids: string[]
          base_price_paise: number
          capacity_items: number | null
          card_compatible: boolean
          color: string | null
          created_at: string
          description: string | null
          filler_compatible: boolean
          height_mm: number | null
          id: string
          images: Json
          length_mm: number | null
          material: string | null
          max_weight_grams: number | null
          name: string
          ribbon_compatible: boolean
          slug: string
          status: string
          stock: number
          updated_at: string
          visible: boolean
          width_mm: number | null
        }
        Insert: {
          allowed_category_ids?: string[]
          allowed_product_ids?: string[]
          base_price_paise?: number
          capacity_items?: number | null
          card_compatible?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          filler_compatible?: boolean
          height_mm?: number | null
          id?: string
          images?: Json
          length_mm?: number | null
          material?: string | null
          max_weight_grams?: number | null
          name: string
          ribbon_compatible?: boolean
          slug: string
          status?: string
          stock?: number
          updated_at?: string
          visible?: boolean
          width_mm?: number | null
        }
        Update: {
          allowed_category_ids?: string[]
          allowed_product_ids?: string[]
          base_price_paise?: number
          capacity_items?: number | null
          card_compatible?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          filler_compatible?: boolean
          height_mm?: number | null
          id?: string
          images?: Json
          length_mm?: number | null
          material?: string | null
          max_weight_grams?: number | null
          name?: string
          ribbon_compatible?: boolean
          slug?: string
          status?: string
          stock?: number
          updated_at?: string
          visible?: boolean
          width_mm?: number | null
        }
        Relationships: []
      }
      festivals: {
        Row: {
          active: boolean
          banner_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: number
          related_category_ids: string[]
          related_giftbox_ids: string[]
          related_product_ids: string[]
          slug: string
          start_date: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: number
          related_category_ids?: string[]
          related_giftbox_ids?: string[]
          related_product_ids?: string[]
          slug: string
          start_date?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: number
          related_category_ids?: string[]
          related_giftbox_ids?: string[]
          related_product_ids?: string[]
          slug?: string
          start_date?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          ends_at: string | null
          id: string
          kind: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          config?: Json
          created_at?: string
          ends_at?: string | null
          id?: string
          kind: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          config?: Json
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          change: number
          created_at: string
          empty_box_id: string | null
          giftbox_id: string | null
          id: string
          note: string | null
          product_id: string | null
          reason: string
          reference_id: string | null
        }
        Insert: {
          actor_id?: string | null
          change: number
          created_at?: string
          empty_box_id?: string | null
          giftbox_id?: string | null
          id?: string
          note?: string | null
          product_id?: string | null
          reason: string
          reference_id?: string | null
        }
        Update: {
          actor_id?: string | null
          change?: number
          created_at?: string
          empty_box_id?: string | null
          giftbox_id?: string | null
          id?: string
          note?: string | null
          product_id?: string | null
          reason?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_empty_box_id_fkey"
            columns: ["empty_box_id"]
            isOneToOne: false
            referencedRelation: "empty_gift_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_giftbox_id_fkey"
            columns: ["giftbox_id"]
            isOneToOne: false
            referencedRelation: "ready_gift_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_address: Json
          created_at: string
          discount_paise: number
          grand_total_paise: number
          id: string
          invoice_number: string
          issued_at: string
          order_id: string
          seller: Json
          shipping_address: Json
          shipping_paise: number
          subtotal_paise: number
          tax_paise: number
          user_id: string
        }
        Insert: {
          billing_address: Json
          created_at?: string
          discount_paise?: number
          grand_total_paise: number
          id?: string
          invoice_number?: string
          issued_at?: string
          order_id: string
          seller: Json
          shipping_address: Json
          shipping_paise?: number
          subtotal_paise: number
          tax_paise?: number
          user_id: string
        }
        Update: {
          billing_address?: Json
          created_at?: string
          discount_paise?: number
          grand_total_paise?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          order_id?: string
          seller?: Json
          shipping_address?: Json
          shipping_paise?: number
          subtotal_paise?: number
          tax_paise?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          image: string | null
          kind: Database["public"]["Enums"]["order_item_kind"]
          line_total_paise: number
          name: string
          order_id: string
          payload: Json | null
          quantity: number
          slug: string
          unit_price_paise: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          image?: string | null
          kind: Database["public"]["Enums"]["order_item_kind"]
          line_total_paise: number
          name: string
          order_id: string
          payload?: Json | null
          quantity: number
          slug: string
          unit_price_paise: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          image?: string | null
          kind?: Database["public"]["Enums"]["order_item_kind"]
          line_total_paise?: number
          name?: string
          order_id?: string
          payload?: Json | null
          quantity?: number
          slug?: string
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          contact: Json
          coupon_code: string | null
          coupon_discount_paise: number
          created_at: string
          discount_paise: number
          estimated_delivery_at: string | null
          grand_total_paise: number
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_paise: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact: Json
          coupon_code?: string | null
          coupon_discount_paise?: number
          created_at?: string
          discount_paise?: number
          estimated_delivery_at?: string | null
          grand_total_paise: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          tax_paise?: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: Json
          coupon_code?: string | null
          coupon_discount_paise?: number
          created_at?: string
          discount_paise?: number
          estimated_delivery_at?: string | null
          grand_total_paise?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: Json
          shipping_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise?: number
          tax_paise?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          currency: string
          error_code: string | null
          error_description: string | null
          id: string
          method: string | null
          order_id: string
          provider: string
          provider_order_id: string | null
          provider_payment_id: string | null
          provider_signature: string | null
          raw_response: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          method?: string | null
          order_id: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          raw_response?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          method?: string | null
          order_id?: string
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string | null
          provider_signature?: string | null
          raw_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipients: {
        Row: {
          created_at: string
          product_id: string
          recipient_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          recipient_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipients_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_relationships: {
        Row: {
          created_at: string
          product_id: string
          relationship_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          relationship_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_relationships_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relationships_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          customization: Json
          description: string | null
          festival_tags: string[]
          gift_builder_compatible: boolean
          height_mm: number | null
          id: string
          images: Json
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_trending: boolean
          length_mm: number | null
          low_stock_threshold: number
          name: string
          offer_price_paise: number | null
          price_paise: number
          related_ids: string[]
          reserved_stock: number
          seo_description: string | null
          seo_title: string | null
          sku: string | null
          slug: string
          status: string
          stock: number
          tags: string[]
          updated_at: string
          videos: Json
          view_count: number
          weight_grams: number | null
          width_mm: number | null
          wishlist_count: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          customization?: Json
          description?: string | null
          festival_tags?: string[]
          gift_builder_compatible?: boolean
          height_mm?: number | null
          id?: string
          images?: Json
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          length_mm?: number | null
          low_stock_threshold?: number
          name: string
          offer_price_paise?: number | null
          price_paise?: number
          related_ids?: string[]
          reserved_stock?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug: string
          status?: string
          stock?: number
          tags?: string[]
          updated_at?: string
          videos?: Json
          view_count?: number
          weight_grams?: number | null
          width_mm?: number | null
          wishlist_count?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          customization?: Json
          description?: string | null
          festival_tags?: string[]
          gift_builder_compatible?: boolean
          height_mm?: number | null
          id?: string
          images?: Json
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          length_mm?: number | null
          low_stock_threshold?: number
          name?: string
          offer_price_paise?: number | null
          price_paise?: number
          related_ids?: string[]
          reserved_stock?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string
          status?: string
          stock?: number
          tags?: string[]
          updated_at?: string
          videos?: Json
          view_count?: number
          weight_grams?: number | null
          width_mm?: number | null
          wishlist_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ready_gift_boxes: {
        Row: {
          card: string | null
          created_at: string
          description: string | null
          empty_box_id: string | null
          festival_tags: string[]
          filler: string | null
          id: string
          images: Json
          is_featured: boolean
          is_trending: boolean
          items: Json
          name: string
          offer_price_paise: number | null
          price_paise: number
          ribbon: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          card?: string | null
          created_at?: string
          description?: string | null
          empty_box_id?: string | null
          festival_tags?: string[]
          filler?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          is_trending?: boolean
          items?: Json
          name: string
          offer_price_paise?: number | null
          price_paise?: number
          ribbon?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          card?: string | null
          created_at?: string
          description?: string | null
          empty_box_id?: string | null
          festival_tags?: string[]
          filler?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          is_trending?: boolean
          items?: Json
          name?: string
          offer_price_paise?: number | null
          price_paise?: number
          ribbon?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ready_gift_boxes_empty_box_id_fkey"
            columns: ["empty_box_id"]
            isOneToOne: false
            referencedRelation: "empty_gift_boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          giftbox_id: string | null
          id: string
          images: Json
          is_featured: boolean
          product_id: string | null
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          giftbox_id?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          product_id?: string | null
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          giftbox_id?: string | null
          id?: string
          images?: Json
          is_featured?: boolean
          product_id?: string | null
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_giftbox_id_fkey"
            columns: ["giftbox_id"]
            isOneToOne: false
            referencedRelation: "ready_gift_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_city: string | null
          author_name: string
          avatar_url: string | null
          created_at: string
          id: string
          quote: string
          rating: number
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          author_city?: string | null
          author_name: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          quote: string
          rating?: number
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          author_city?: string | null
          author_name?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          quote?: string
          rating?: number
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_view: { Args: { _slug: string }; Returns: undefined }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      product_review_stats: {
        Args: { _product_id: string }
        Returns: {
          avg_rating: number
          review_count: number
        }[]
      }
      redeem_coupon: {
        Args: {
          _coupon_id: string
          _discount_paise: number
          _order_id: string
          _user_id: string
        }
        Returns: boolean
      }
      validate_coupon: {
        Args: { _code: string; _subtotal_paise: number; _user_id: string }
        Returns: {
          coupon_id: string
          discount_type: string
          discount_value: number
          error: string
          max_discount_paise: number
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "staff" | "customer"
      order_item_kind: "product" | "ready-box" | "custom-box"
      order_status:
        | "pending"
        | "payment_pending"
        | "payment_failed"
        | "confirmed"
        | "processing"
        | "packed"
        | "ready_for_shipment"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "refund_requested"
        | "refunded"
        | "returned"
      payment_method: "cod" | "razorpay"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
  public: {
    Enums: {
      app_role: ["super_admin", "staff", "customer"],
      order_item_kind: ["product", "ready-box", "custom-box"],
      order_status: [
        "pending",
        "payment_pending",
        "payment_failed",
        "confirmed",
        "processing",
        "packed",
        "ready_for_shipment",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refund_requested",
        "refunded",
        "returned",
      ],
      payment_method: ["cod", "razorpay"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
