export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Region      = 'EU' | 'UK' | 'IN'
export type Currency    = 'EUR' | 'GBP' | 'INR'
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled'
export type QuoteStatus = 'pending' | 'sent' | 'accepted' | 'declined' | 'expired'
export type UserRole    = 'customer' | 'admin' | 'staff'

export interface Database {
  public: {
    Tables: {
      // ── profiles ──────────────────────────────────────────────────────
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          company_vat: string | null
          company_gstin: string | null
          phone: string | null
          region: Region | null
          preferred_currency: Currency
          role: UserRole
          user_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          company_vat?: string | null
          company_gstin?: string | null
          phone?: string | null
          region?: Region | null
          preferred_currency?: Currency
          role?: UserRole
          user_type?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      // ── categories ────────────────────────────────────────────────────
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }

      // ── venues ────────────────────────────────────────────────────────
      venues: {
        Row: {
          id: string
          name: string
          city: string
          country: string
          region: Region
          address: string | null
          website: string | null
          created_at: string
        }
        Insert: {
          name: string
          city: string
          country: string
          region: Region
          address?: string | null
          website?: string | null
        }
        Update: Partial<Database['public']['Tables']['venues']['Insert']>
      }

      // ── products ──────────────────────────────────────────────────────
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category_id: string | null
          price_eur: number
          price_gbp: number
          price_inr: number
          images: string[]
          available_regions: Region[]
          available_venues: string[]
          badge: string | null
          dimensions: string | null
          stock_status: 'available' | 'limited' | 'unavailable'
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          category_id?: string | null
          price_eur: number
          price_gbp: number
          price_inr: number
          images?: string[]
          available_regions?: Region[]
          available_venues?: string[]
          badge?: string | null
          dimensions?: string | null
          stock_status?: 'available' | 'limited' | 'unavailable'
          is_featured?: boolean
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }

      // ── cart_items ────────────────────────────────────────────────────
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          event_name: string | null
          event_date: string | null
          venue_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          product_id: string
          quantity?: number
          event_name?: string | null
          event_date?: string | null
          venue_id?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
      }

      // ── orders ────────────────────────────────────────────────────────
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          status: OrderStatus
          region: Region
          currency: Currency
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          billing_name: string
          billing_company: string | null
          billing_email: string
          billing_phone: string | null
          billing_vat_number: string | null
          billing_gstin: string | null
          event_name: string | null
          event_date: string | null
          venue_id: string | null
          delivery_notes: string | null
          stripe_payment_intent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          status?: OrderStatus
          region: Region
          currency: Currency
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          billing_name: string
          billing_company?: string | null
          billing_email: string
          billing_phone?: string | null
          billing_vat_number?: string | null
          billing_gstin?: string | null
          event_name?: string | null
          event_date?: string | null
          venue_id?: string | null
          delivery_notes?: string | null
          stripe_payment_intent?: string | null
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }

      // ── order_items ───────────────────────────────────────────────────
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          total_price: number
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }

      // ── quotes ────────────────────────────────────────────────────────
      quotes: {
        Row: {
          id: string
          quote_number: string
          user_id: string | null
          contact_name: string
          contact_email: string
          contact_company: string | null
          contact_phone: string | null
          region: Region
          event_name: string | null
          event_date: string | null
          venue_id: string | null
          message: string | null
          status: QuoteStatus
          quoted_amount: number | null
          currency: Currency
          expires_at: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          contact_name: string
          contact_email: string
          contact_company?: string | null
          contact_phone?: string | null
          region: Region
          event_name?: string | null
          event_date?: string | null
          venue_id?: string | null
          message?: string | null
          status?: QuoteStatus
          quoted_amount?: number | null
          currency?: Currency
          expires_at?: string | null
          admin_notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['quotes']['Insert']>
      }

      // ── quote_items ───────────────────────────────────────────────────
      quote_items: {
        Row: {
          id: string
          quote_id: string
          product_id: string | null
          description: string
          quantity: number
          unit_price: number | null
          created_at: string
        }
        Insert: {
          quote_id: string
          product_id?: string | null
          description: string
          quantity?: number
          unit_price?: number | null
        }
        Update: Partial<Database['public']['Tables']['quote_items']['Insert']>
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      get_cart_total: {
        Args: { p_user_id: string; p_currency: Currency }
        Returns: number
      }
    }

    Enums: {
      region: Region
      currency: Currency
      order_status: OrderStatus
      quote_status: QuoteStatus
      user_role: UserRole
    }
  }
}

// ── Convenience Row types ─────────────────────────────────────────────────────
export type Profile   = Database['public']['Tables']['profiles']['Row']
export type Category  = Database['public']['Tables']['categories']['Row']
export type Venue     = Database['public']['Tables']['venues']['Row']
export type Product   = Database['public']['Tables']['products']['Row']
export type CartItem  = Database['public']['Tables']['cart_items']['Row']
export type Order     = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Quote     = Database['public']['Tables']['quotes']['Row']
export type QuoteItem = Database['public']['Tables']['quote_items']['Row']

// ── Extended types with joins ─────────────────────────────────────────────────
export type ProductWithCategory  = Product & { categories: Category }
export type OrderWithItems       = Order & {
  order_items: (OrderItem & { products: Product })[]
  venues: Venue | null
}

// ── MARKETPLACE TYPES ────────────────────────────────────────────────────────

export type UserType = 'consultant' | 'vendor' | 'admin'

export type VendorOrderStatus =
  | 'pending' | 'confirmed' | 'in_progress'
  | 'delivered' | 'completed' | 'cancelled'

export type ProjectStatus =
  | 'draft' | 'active' | 'ordered' | 'completed' | 'cancelled'

export type EmergencyStatus = 'open' | 'fulfilled' | 'expired' | 'cancelled'
export type PayoutStatus    = 'pending' | 'processing' | 'paid' | 'failed'

export interface VendorProfile {
  id:                string
  user_id:           string
  company_name:      string
  description:       string | null
  logo_url:          string | null
  website:           string | null
  phone:             string | null
  regions:           Region[]
  categories:        string[]
  is_verified:       boolean
  is_active:         boolean
  onboarding_done:   boolean
  gstin:             string | null
  vat_number:        string | null
  bank_account_name: string | null
  bank_account_no:   string | null
  bank_ifsc:         string | null
  created_at:        string
  updated_at:        string
}

export interface VendorProduct {
  id:               string
  vendor_id:        string
  name:             string
  slug:             string
  description:      string | null
  category:         string | null
  price_per_day:    number
  currency:         Currency
  regions:          Region[]
  dimensions:       string | null
  weight_kg:        number | null
  total_stock:      number
  available_stock:  number
  min_rental_days:  number
  max_rental_days:  number
  is_active:        boolean
  is_featured:      boolean
  badge:            string | null
  tags:             string[]
  created_at:       string
  updated_at:       string
}

export interface ProductImage {
  id:         string
  product_id: string
  url:        string
  filename:   string
  size_bytes: number
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface ProductAvailability {
  id:         string
  product_id: string
  date:       string
  stock:      number
  is_blocked: boolean
  note:       string | null
  created_at: string
}

export interface Project {
  id:             string
  consultant_id:  string
  name:           string
  description:    string | null
  event_name:     string | null
  venue:          string | null
  city:           string | null
  region:         Region | null
  start_date:     string | null
  end_date:       string | null
  budget:         number | null
  currency:       Currency
  status:         ProjectStatus
  created_at:     string
  updated_at:     string
}

export interface ProjectItem {
  id:                string
  project_id:        string
  vendor_product_id: string
  vendor_id:         string
  quantity:          number
  days:              number
  unit_price:        number
  total_price:       number
  notes:             string | null
  created_at:        string
}

export interface VendorOrder {
  id:               string
  order_number:     string
  project_id:       string
  consultant_id:    string
  vendor_id:        string
  status:           VendorOrderStatus
  subtotal:         number
  tax_amount:       number
  total:            number
  currency:         Currency
  delivery_address: string | null
  delivery_date:    string | null
  notes:            string | null
  vendor_notes:     string | null
  created_at:       string
  updated_at:       string
}

export interface VendorOrderItem {
  id:                string
  vendor_order_id:   string
  vendor_product_id: string | null
  product_name:      string
  quantity:          number
  days:              number
  unit_price:        number
  total_price:       number
  created_at:        string
}

export interface EmergencyRequest {
  id:            string
  consultant_id: string
  title:         string
  description:   string | null
  category:      string | null
  quantity:      number
  required_date: string
  venue:         string | null
  city:          string | null
  region:        Region | null
  budget:        number | null
  currency:      Currency
  status:        EmergencyStatus
  fulfilled_by:  string | null
  expires_at:    string
  created_at:    string
}

export interface EmergencyResponse {
  id:                   string
  emergency_request_id: string
  vendor_id:            string
  message:              string | null
  quoted_price:         number | null
  can_fulfill:          boolean
  created_at:           string
}

export interface Payout {
  id:              string
  vendor_id:       string
  vendor_order_id: string | null
  amount:          number
  currency:        Currency
  status:          PayoutStatus
  payout_date:     string | null
  reference:       string | null
  notes:           string | null
  created_at:      string
}

// Extended types with joins
export type VendorProductWithImages  = VendorProduct & { product_images: ProductImage[] }
export type VendorProductWithVendor  = VendorProduct & { vendor_profiles: VendorProfile }
export type ProjectWithItems         = Project & { project_items: (ProjectItem & { vendor_products: VendorProduct & { vendor_profiles: VendorProfile } })[] }
export type VendorOrderWithItems     = VendorOrder & { vendor_order_items: VendorOrderItem[] }
