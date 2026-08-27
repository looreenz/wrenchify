export type Language = 'it' | 'es'

export type QuoteStatus = 'draft' | 'accepted' | 'rejected' | 'converted'

export type WorkOrderPaymentStatus = 'pending' | 'partial' | 'paid'

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type WorkOrderItemType = 'parts' | 'labor'

export type SettingKey =
  | 'hourly_rate'
  | 'default_language'
  | 'shop_name'
  | 'currency'
  | 'vat_rate'

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

export interface CustomerCreate {
  first_name?: string | null
  last_name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  fiscal_code?: string | null
  notes?: string | null
  preferred_language?: Language
}

export interface CustomerUpdate {
  first_name?: string | null
  last_name?: string
  phone?: string | null
  email?: string | null
  address?: string | null
  fiscal_code?: string | null
  notes?: string | null
  preferred_language?: Language
}

export interface CustomerFilter {
  search?: string
}

export interface CustomerWithVehicleCount extends Customer {
  vehicle_count: number
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

export interface VehicleCreate {
  customer_id: number
  license_plate: string
  make?: string | null
  model: string
  year?: number | null
  vin?: string | null
  notes?: string | null
}

export interface VehicleUpdate {
  customer_id?: number
  license_plate?: string
  make?: string | null
  model?: string
  year?: number | null
  vin?: string | null
  notes?: string | null
}

export interface VehicleFilter {
  customer_id?: number
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

export interface QuoteItem {
  id: number
  quote_id: number
  description: string
  quantity: number
  customer_price: number
  workshop_price: number
  item_type: WorkOrderItemType
  created_at: string
  updated_at: string
}

export interface QuoteItemCreate {
  description: string
  quantity?: number
  customer_price?: number
  workshop_price?: number
  item_type?: WorkOrderItemType
}

export interface QuoteItemUpdate {
  description?: string
  quantity?: number
  customer_price?: number
  workshop_price?: number
  item_type?: WorkOrderItemType
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
  vat_rate: number
  customer_total: number
  workshop_total: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface QuoteCreate {
  vehicle_id: number
  customer_id: number
  date?: string
  description?: string | null
  labor_hours?: number
  hourly_rate?: number
  notes?: string | null
}

export interface QuoteUpdate {
  vehicle_id?: number
  customer_id?: number
  date?: string
  description?: string | null
  labor_hours?: number
  hourly_rate?: number
  notes?: string | null
  status?: QuoteStatus
}

export interface QuoteFilter {
  customer_id?: number
  vehicle_id?: number
  status?: QuoteStatus
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
  vat_rate: number
  customer_total: number
  workshop_total: number
  payment_status: WorkOrderPaymentStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WorkOrderCreate {
  vehicle_id: number
  customer_id: number
  quote_id?: number | null
  date_in?: string
  date_out?: string | null
  mileage_in?: number | null
  mileage_out?: number | null
  description?: string | null
  labor_hours?: number
  hourly_rate?: number
  notes?: string | null
}

export interface WorkOrderUpdate {
  vehicle_id?: number
  customer_id?: number
  quote_id?: number | null
  date_in?: string
  date_out?: string | null
  mileage_in?: number | null
  mileage_out?: number | null
  description?: string | null
  labor_hours?: number
  hourly_rate?: number
  notes?: string | null
}

export interface WorkOrderFilter {
  customer_id?: number
  vehicle_id?: number
  date_from?: string
  date_to?: string
  payment_status?: WorkOrderPaymentStatus
}

export interface WorkOrderItem {
  id: number
  work_order_id: number
  description: string
  quantity: number
  customer_price: number
  workshop_price: number
  item_type: WorkOrderItemType
  created_at: string
  updated_at: string
}

export interface WorkOrderItemCreate {
  description: string
  quantity?: number
  customer_price?: number
  workshop_price?: number
  item_type?: WorkOrderItemType
}

export interface WorkOrderItemUpdate {
  description?: string
  quantity?: number
  customer_price?: number
  workshop_price?: number
  item_type?: WorkOrderItemType
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

export interface PaymentCreate {
  work_order_id: number
  amount: number
  payment_method: PaymentMethod
  payment_date?: string
  notes?: string | null
}

export interface PaymentUpdate {
  work_order_id?: number
  amount?: number
  payment_method?: PaymentMethod
  payment_date?: string
  notes?: string | null
}

export interface Setting {
  key: SettingKey
  value: string
}

export interface SettingsMap {
  hourly_rate: number
  default_language: Language
  shop_name: string
  currency: string
  vat_rate: number
}

export interface DocumentTotals {
  customer_subtotal: number
  workshop_subtotal: number
  labor_subtotal: number
  vat_amount: number
  customer_total: number
  workshop_total: number
  parts_total: number
  net_profit: number
}

export interface WrenchifyAPI {
  platform: string
  versions: {
    node: string
    electron: string
  }
  customers: {
    list: (search?: string) => Promise<CustomerWithVehicleCount[]>
    getById: (id: number) => Promise<Customer | undefined>
    create: (data: CustomerCreate) => Promise<Customer>
    update: (id: number, data: CustomerUpdate) => Promise<Customer>
    delete: (id: number) => Promise<void>
  }
  vehicles: {
    list: (filter?: VehicleFilter) => Promise<Vehicle[]>
    getById: (id: number) => Promise<Vehicle | undefined>
    create: (data: VehicleCreate) => Promise<Vehicle>
    update: (id: number, data: VehicleUpdate) => Promise<Vehicle>
    delete: (id: number) => Promise<void>
    getTimeline: (vehicleId: number) => Promise<VehicleTimelineEntry[]>
  }
  quotes: {
    list: (filter?: QuoteFilter) => Promise<Quote[]>
    getById: (id: number) => Promise<Quote | undefined>
    create: (data: QuoteCreate) => Promise<Quote>
    update: (id: number, data: QuoteUpdate) => Promise<Quote>
    delete: (id: number) => Promise<void>
    convert: (id: number) => Promise<WorkOrder>
    getLineItems: (quoteId: number) => Promise<QuoteItem[]>
    addLineItem: (quoteId: number, data: QuoteItemCreate) => Promise<QuoteItem>
    updateLineItem: (itemId: number, data: QuoteItemUpdate) => Promise<QuoteItem>
    deleteLineItem: (itemId: number) => Promise<void>
  }
  workOrders: {
    list: (filter?: WorkOrderFilter) => Promise<WorkOrder[]>
    getById: (id: number) => Promise<WorkOrder | undefined>
    create: (data: WorkOrderCreate) => Promise<WorkOrder>
    update: (id: number, data: WorkOrderUpdate) => Promise<WorkOrder>
    delete: (id: number) => Promise<void>
    getLineItems: (workOrderId: number) => Promise<WorkOrderItem[]>
    addLineItem: (workOrderId: number, data: WorkOrderItemCreate) => Promise<WorkOrderItem>
    updateLineItem: (itemId: number, data: WorkOrderItemUpdate) => Promise<WorkOrderItem>
    deleteLineItem: (itemId: number) => Promise<void>
  }
  payments: {
    listByWorkOrder: (workOrderId: number) => Promise<Payment[]>
    create: (data: PaymentCreate) => Promise<Payment>
    update: (id: number, data: PaymentUpdate) => Promise<Payment>
    delete: (id: number) => Promise<void>
  }
  settings: {
    getAll: () => Promise<SettingsMap>
    update: (key: SettingKey, value: string) => Promise<void>
  }
  backup: {
    exportManual: () => Promise<BackupResult>
    restore: () => Promise<BackupResult>
  }
}

export interface BackupResult {
  success: boolean
  path?: string
  error?: string
}
