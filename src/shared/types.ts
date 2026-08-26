export type Language = 'it' | 'es'

export type QuoteStatus = 'draft' | 'accepted' | 'rejected' | 'converted'

export type WorkOrderPaymentStatus = 'pending' | 'partial' | 'paid'

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type WorkOrderItemType = 'parts' | 'labor'

export interface Customer {
  id: number
  first_name: string | null
  last_name: string
  phone: string | null
  email: string | null
  address: string | null
  fiscal_code: string | null
  notes: string | null
  preferred_language: Language
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: number
  customer_id: number
  license_plate: string
  make: string | null
  model: string
  year: number | null
  vin: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Quote {
  id: number
  vehicle_id: number
  customer_id: number
  quote_number: string
  date: string
  status: QuoteStatus
  description: string | null
  labor_hours: number
  hourly_rate: number
  parts_cost: number
  total_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrder {
  id: number
  vehicle_id: number
  customer_id: number
  quote_id: number | null
  order_number: string
  date_in: string
  date_out: string | null
  mileage_in: number | null
  mileage_out: number | null
  description: string | null
  labor_hours: number
  hourly_rate: number
  parts_cost: number
  total_cost: number
  payment_status: WorkOrderPaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderItem {
  id: number
  work_order_id: number
  description: string
  quantity: number
  unit_price: number
  item_type: WorkOrderItemType
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  work_order_id: number
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type SettingKey =
  | 'hourly_rate'
  | 'default_language'
  | 'shop_name'
  | 'currency'

export interface Setting {
  key: SettingKey
  value: string
}

export interface SettingsMap {
  hourly_rate: number
  default_language: Language
  shop_name: string
  currency: string
}

export interface CustomerWithVehicleCount extends Customer {
  vehicle_count: number
}

export interface VehicleTimelineEntry {
  id: number
  order_number: string
  date_in: string
  date_out: string | null
  mileage_in: number | null
  mileage_out: number | null
  description: string | null
  total_cost: number
  payment_status: WorkOrderPaymentStatus
}
