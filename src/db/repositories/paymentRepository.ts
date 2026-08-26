import type { Payment, PaymentCreate, PaymentUpdate, PaymentMethod } from '../../shared/types'
import { getDatabase } from '../connection'
import { recalculatePaymentStatus } from './workOrderRepository'

function mapRow(row: unknown): Payment {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    work_order_id: r.work_order_id as number,
    amount: Number(r.amount ?? 0),
    payment_method: r.payment_method as PaymentMethod,
    payment_date: r.payment_date as string,
    notes: r.notes as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

function validatePayment(data: PaymentCreate | PaymentUpdate, isCreate = false): void {
  if ((isCreate || data.amount !== undefined) && (data.amount === undefined || data.amount <= 0)) {
    throw new Error('Payment amount must be greater than zero')
  }

  if (isCreate && !data.payment_method) {
    throw new Error('Payment method is required')
  }

  if (data.payment_date) {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (data.payment_date > today) {
      throw new Error('Payment date cannot be in the future')
    }
  }
}

export function listByWorkOrder(workOrderId: number): Payment[] {
  const db = getDatabase()
  const rows = db
    .prepare('SELECT * FROM payments WHERE work_order_id = ? ORDER BY payment_date DESC, id DESC')
    .all(workOrderId) as Record<string, unknown>[]
  return rows.map(mapRow)
}

export function getById(id: number): Payment | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id)
  return row ? mapRow(row) : undefined
}

export function create(data: PaymentCreate): Payment {
  const db = getDatabase()
  validatePayment(data, true)

  const workOrderId = data.work_order_id
  const workOrder = db.prepare('SELECT payment_status FROM work_orders WHERE id = ?').get(workOrderId) as
    | { payment_status: string }
    | undefined

  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  if (workOrder.payment_status === 'paid') {
    throw new Error('Cannot add payments to a paid work order')
  }

  const paymentDate = data.payment_date ?? new Date().toISOString().slice(0, 10)

  const result = db
    .prepare(
      `
      INSERT INTO payments (work_order_id, amount, payment_method, payment_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(workOrderId, data.amount, data.payment_method, paymentDate, data.notes ?? null)

  const paymentId = Number(result.lastInsertRowid)
  recalculatePaymentStatus(workOrderId)

  const payment = getById(paymentId)
  if (!payment) {
    throw new Error('Failed to create payment')
  }
  return payment
}

export function update(id: number, data: PaymentUpdate): Payment {
  const db = getDatabase()
  validatePayment(data, false)

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Payment ${id} not found`)
  }

  const workOrderId = data.work_order_id ?? existing.work_order_id
  const amount = data.amount ?? existing.amount
  const paymentMethod = data.payment_method ?? existing.payment_method
  const paymentDate = data.payment_date ?? existing.payment_date
  const notes = ('notes' in data ? data.notes : existing.notes) as string | null

  const workOrder = db.prepare('SELECT payment_status FROM work_orders WHERE id = ?').get(workOrderId) as
    | { payment_status: string }
    | undefined

  if (!workOrder) {
    throw new Error(`Work order ${workOrderId} not found`)
  }

  if (workOrder.payment_status === 'paid') {
    throw new Error('Cannot edit payments on a paid work order')
  }

  const result = db
    .prepare(
      `
      UPDATE payments
      SET work_order_id = ?,
          amount = ?,
          payment_method = ?,
          payment_date = ?,
          notes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(
      workOrderId ?? existing.work_order_id,
      amount,
      paymentMethod,
      paymentDate,
      notes ?? null,
      id
    )

  if (result.changes === 0) {
    throw new Error(`Payment ${id} not updated`)
  }

  recalculatePaymentStatus(workOrderId)

  const payment = getById(id)
  if (!payment) {
    throw new Error(`Payment ${id} disappeared after update`)
  }
  return payment
}

export function remove(id: number): void {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Payment ${id} not found`)
  }

  const workOrder = db.prepare('SELECT payment_status FROM work_orders WHERE id = ?').get(existing.work_order_id) as
    | { payment_status: string }
    | undefined

  if (workOrder && workOrder.payment_status === 'paid') {
    throw new Error('Cannot delete payments on a paid work order')
  }

  const result = db.prepare('DELETE FROM payments WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Payment ${id} not found`)
  }

  recalculatePaymentStatus(existing.work_order_id)
}

export const paymentRepository = {
  listByWorkOrder,
  getById,
  create,
  update,
  delete: remove
}
