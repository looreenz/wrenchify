import type {
  WorkOrder,
  WorkOrderCreate,
  WorkOrderUpdate,
  WorkOrderFilter,
  WorkOrderItem,
  WorkOrderItemCreate,
  WorkOrderItemUpdate,
  WorkOrderPaymentStatus
} from '../../shared/types'
import { getDatabase } from '../connection'
import { getHourlyRate } from './settingsRepository'

function roundCost(value: number): number {
  return Math.round(value * 100) / 100
}

function getTodayPrefix(prefix: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${prefix}-${yyyy}${mm}${dd}-`
}

function generateOrderNumber(db: ReturnType<typeof getDatabase>): string {
  const todayPrefix = getTodayPrefix('WO')
  const row = db
    .prepare('SELECT order_number FROM work_orders WHERE order_number LIKE ? ORDER BY order_number DESC LIMIT 1')
    .get(`${todayPrefix}%`) as { order_number: string } | undefined

  let next = 1
  if (row?.order_number) {
    const suffix = row.order_number.slice(-3)
    next = Number.parseInt(suffix, 10) + 1
  }

  return `${todayPrefix}${String(next).padStart(3, '0')}`
}

function calculateWorkOrderTotal(
  db: ReturnType<typeof getDatabase>,
  workOrder: {
    id?: number
    labor_hours: number
    hourly_rate: number
    parts_cost: number
  }
): number {
  const itemsTotal = db
    .prepare('SELECT COALESCE(SUM(quantity * unit_price), 0) AS total FROM work_order_items WHERE work_order_id = ?')
    .get(workOrder.id ?? 0) as { total: number }

  return roundCost(workOrder.labor_hours * workOrder.hourly_rate + workOrder.parts_cost + Number(itemsTotal.total))
}

function resolvePaymentStatus(totalCost: number, paidAmount: number): WorkOrderPaymentStatus {
  if (paidAmount <= 0) return 'pending'
  if (paidAmount >= totalCost) return 'paid'
  return 'partial'
}

export function recalculatePaymentStatus(workOrderId: number): void {
  const db = getDatabase()

  const workOrder = getById(workOrderId)
  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  const paymentRow = db
    .prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE work_order_id = ?')
    .get(workOrderId) as { total: number }

  const paidAmount = Number(paymentRow.total)
  const newStatus = resolvePaymentStatus(workOrder.total_cost, paidAmount)

  db.prepare('UPDATE work_orders SET payment_status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    newStatus,
    workOrderId
  )
}

export function recalculateTotalCost(workOrderId: number): void {
  const db = getDatabase()

  const workOrder = getById(workOrderId)
  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  const totalCost = calculateWorkOrderTotal(db, {
    id: workOrderId,
    labor_hours: workOrder.labor_hours,
    hourly_rate: workOrder.hourly_rate,
    parts_cost: workOrder.parts_cost
  })

  db.prepare('UPDATE work_orders SET total_cost = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    totalCost,
    workOrderId
  )
}

function validateMileage(mileageIn?: number | null, mileageOut?: number | null): void {
  if (mileageIn !== undefined && mileageIn !== null && mileageOut !== undefined && mileageOut !== null) {
    if (mileageOut < mileageIn) {
      throw new Error('Mileage out must be greater than or equal to mileage in')
    }
  }
}

function mapRow(row: unknown): WorkOrder {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    vehicle_id: r.vehicle_id as number,
    customer_id: r.customer_id as number,
    quote_id: r.quote_id as number | null,
    order_number: r.order_number as string,
    date_in: r.date_in as string,
    date_out: r.date_out as string | null,
    mileage_in: r.mileage_in as number | null,
    mileage_out: r.mileage_out as number | null,
    description: r.description as string | null,
    labor_hours: Number(r.labor_hours ?? 0),
    hourly_rate: Number(r.hourly_rate ?? 0),
    parts_cost: Number(r.parts_cost ?? 0),
    total_cost: Number(r.total_cost ?? 0),
    payment_status: r.payment_status as WorkOrderPaymentStatus,
    notes: r.notes as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

function mapItemRow(row: unknown): WorkOrderItem {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    work_order_id: r.work_order_id as number,
    description: r.description as string,
    quantity: Number(r.quantity ?? 1),
    unit_price: Number(r.unit_price ?? 0),
    item_type: r.item_type as 'parts' | 'labor',
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

export function list(filter?: WorkOrderFilter): WorkOrder[] {
  const db = getDatabase()

  const sql = `
    SELECT * FROM work_orders
    WHERE (? IS NULL OR customer_id = ?)
      AND (? IS NULL OR vehicle_id = ?)
      AND (? IS NULL OR date_in >= ?)
      AND (? IS NULL OR date_in <= ?)
      AND (? IS NULL OR payment_status = ?)
    ORDER BY date_in DESC, id DESC
  `

  const customerId = filter?.customer_id ?? null
  const vehicleId = filter?.vehicle_id ?? null
  const dateFrom = filter?.date_from ?? null
  const dateTo = filter?.date_to ?? null
  const paymentStatus = filter?.payment_status ?? null

  const rows = db
    .prepare(sql)
    .all(
      customerId,
      customerId,
      vehicleId,
      vehicleId,
      dateFrom,
      dateFrom,
      dateTo,
      dateTo,
      paymentStatus,
      paymentStatus
    ) as Record<string, unknown>[]

  return rows.map(mapRow)
}

export function getById(id: number): WorkOrder | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id)
  return row ? mapRow(row) : undefined
}

export function create(data: WorkOrderCreate): WorkOrder {
  const db = getDatabase()

  validateMileage(data.mileage_in, data.mileage_out)

  const dateIn = data.date_in ?? new Date().toISOString().slice(0, 10)
  const hourlyRate = data.hourly_rate ?? getHourlyRate()
  const laborHours = data.labor_hours ?? 0
  const partsCost = data.parts_cost ?? 0
  const orderNumber = generateOrderNumber(db)

  const result = db
    .prepare(
      `
      INSERT INTO work_orders (
        vehicle_id, customer_id, quote_id, order_number, date_in, date_out,
        mileage_in, mileage_out, description, labor_hours, hourly_rate, parts_cost, total_cost, payment_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `
    )
    .run(
      data.vehicle_id,
      data.customer_id,
      data.quote_id ?? null,
      orderNumber,
      dateIn,
      data.date_out ?? null,
      data.mileage_in ?? null,
      data.mileage_out ?? null,
      data.description ?? null,
      laborHours,
      hourlyRate,
      partsCost,
      0,
      data.notes ?? null
    )

  const workOrderId = Number(result.lastInsertRowid)
  recalculateTotalCost(workOrderId)

  const workOrder = getById(workOrderId)
  if (!workOrder) {
    throw new Error('Failed to create work order')
  }
  return workOrder
}

export function update(id: number, data: WorkOrderUpdate): WorkOrder {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Work order ${id} not found`)
  }

  const vehicleId = 'vehicle_id' in data ? data.vehicle_id : existing.vehicle_id
  const customerId = 'customer_id' in data ? data.customer_id : existing.customer_id
  const quoteId = 'quote_id' in data ? data.quote_id : existing.quote_id
  const dateIn = 'date_in' in data ? data.date_in : existing.date_in
  const dateOut = 'date_out' in data ? data.date_out : existing.date_out
  const mileageIn = 'mileage_in' in data ? data.mileage_in : existing.mileage_in
  const mileageOut = 'mileage_out' in data ? data.mileage_out : existing.mileage_out
  const description = 'description' in data ? data.description : existing.description
  const laborHours = 'labor_hours' in data ? data.labor_hours : existing.labor_hours
  const hourlyRate = 'hourly_rate' in data ? data.hourly_rate : existing.hourly_rate
  const partsCost = 'parts_cost' in data ? data.parts_cost : existing.parts_cost
  const notes = 'notes' in data ? data.notes : existing.notes

  validateMileage(mileageIn, mileageOut)

  const result = db
    .prepare(
      `
      UPDATE work_orders
      SET vehicle_id = ?,
          customer_id = ?,
          quote_id = ?,
          date_in = ?,
          date_out = ?,
          mileage_in = ?,
          mileage_out = ?,
          description = ?,
          labor_hours = ?,
          hourly_rate = ?,
          parts_cost = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(
      vehicleId ?? existing.vehicle_id,
      customerId ?? existing.customer_id,
      quoteId ?? null,
      dateIn,
      dateOut ?? null,
      mileageIn ?? null,
      mileageOut ?? null,
      description ?? null,
      laborHours ?? 0,
      hourlyRate ?? 0,
      partsCost ?? 0,
      notes ?? null,
      id
    )

  if (result.changes === 0) {
    throw new Error(`Work order ${id} not updated`)
  }

  recalculateTotalCost(id)

  const workOrder = getById(id)
  if (!workOrder) {
    throw new Error(`Work order ${id} disappeared after update`)
  }
  return workOrder
}

export function remove(id: number): void {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Work order ${id} not found`)
  }

  const result = db.prepare('DELETE FROM work_orders WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Work order ${id} not found`)
  }
}

export function getLineItems(workOrderId: number): WorkOrderItem[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM work_order_items WHERE work_order_id = ? ORDER BY id')
    .all(workOrderId) as Record<string, unknown>[]
  return rows.map(mapItemRow)
}

export function addLineItem(workOrderId: number, data: WorkOrderItemCreate): WorkOrderItem {
  const db = getDatabase()

  const workOrder = getById(workOrderId)
  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  if (workOrder.payment_status === 'paid') {
    throw new Error('Cannot edit line items on a paid work order')
  }

  const quantity = data.quantity ?? 1
  const unitPrice = data.unit_price ?? 0
  const itemType = data.item_type ?? 'parts'

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero')
  }

  if (unitPrice < 0) {
    throw new Error('Unit price must be non-negative')
  }

  const result = db
    .prepare(
      `
      INSERT INTO work_order_items (work_order_id, description, quantity, unit_price, item_type)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(workOrderId, data.description, quantity, unitPrice, itemType)

  recalculateTotalCost(workOrderId)

  const item = db.prepare('SELECT * FROM work_order_items WHERE id = ?').get(Number(result.lastInsertRowid))
  if (!item) {
    throw new Error('Failed to create work order item')
  }
  return mapItemRow(item)
}

export function updateLineItem(itemId: number, data: WorkOrderItemUpdate): WorkOrderItem {
  const db = getDatabase()

  const existing = db.prepare('SELECT * FROM work_order_items WHERE id = ?').get(itemId) as Record<
    string,
    unknown
  > | undefined
  if (!existing) {
    throw new Error(`Work order item ${itemId} not found`)
  }

  const workOrderId = existing.work_order_id as number
  const workOrder = getById(workOrderId)
  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  if (workOrder.payment_status === 'paid') {
    throw new Error('Cannot edit line items on a paid work order')
  }

  const description = (data.description ?? existing.description) as string
  const quantity = data.quantity ?? (existing.quantity as number)
  const unitPrice = data.unit_price ?? (existing.unit_price as number)
  const itemType = (data.item_type ?? existing.item_type) as 'parts' | 'labor'

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than zero')
  }

  if (unitPrice < 0) {
    throw new Error('Unit price must be non-negative')
  }

  const result = db
    .prepare(
      `
      UPDATE work_order_items
      SET description = ?,
          quantity = ?,
          unit_price = ?,
          item_type = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(description, quantity, unitPrice, itemType, itemId)

  if (result.changes === 0) {
    throw new Error(`Work order item ${itemId} not updated`)
  }

  recalculateTotalCost(workOrderId)

  const item = db.prepare('SELECT * FROM work_order_items WHERE id = ?').get(itemId)
  if (!item) {
    throw new Error(`Work order item ${itemId} disappeared after update`)
  }
  return mapItemRow(item)
}

export function deleteLineItem(itemId: number): void {
  const db = getDatabase()

  const existing = db.prepare('SELECT * FROM work_order_items WHERE id = ?').get(itemId) as Record<
    string,
    unknown
  > | undefined
  if (!existing) {
    throw new Error(`Work order item ${itemId} not found`)
  }

  const workOrderId = existing.work_order_id as number
  const workOrder = getById(workOrderId)
  if (workOrder && workOrder.payment_status === 'paid') {
    throw new Error('Cannot edit line items on a paid work order')
  }

  const result = db.prepare('DELETE FROM work_order_items WHERE id = ?').run(itemId)
  if (result.changes === 0) {
    throw new Error(`Work order item ${itemId} not found`)
  }

  recalculateTotalCost(workOrderId)
}

export const workOrderRepository = {
  list,
  getById,
  create,
  update,
  delete: remove,
  getLineItems,
  addLineItem,
  updateLineItem,
  deleteLineItem
}
