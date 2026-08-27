import type {
  Quote,
  QuoteCreate,
  QuoteUpdate,
  QuoteFilter,
  QuoteStatus,
  WorkOrder
} from '../../shared/types'
import { getDatabase } from '../connection'
import { getHourlyRate } from './settingsRepository'

function roundCost(value: number): number {
  return Math.round(value * 100) / 100
}

function calculateQuoteTotal(quote: {
  labor_hours: number
  hourly_rate: number
  parts_cost: number
}): number {
  return roundCost(quote.labor_hours * quote.hourly_rate + quote.parts_cost)
}

function getTodayPrefix(prefix: string): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${prefix}-${yyyy}${mm}${dd}-`
}

function generateNumber(db: ReturnType<typeof getDatabase>, prefix: string): string {
  const todayPrefix = getTodayPrefix(prefix)

  const table = prefix === 'Q' ? 'quotes' : 'work_orders'
  const column = prefix === 'Q' ? 'quote_number' : 'order_number'

  const row = db
    .prepare(`SELECT ${column} AS number FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`)
    .get(`${todayPrefix}%`) as { number: string } | undefined

  let next = 1
  if (row?.number) {
    const suffix = row.number.slice(-3)
    next = Number.parseInt(suffix, 10) + 1
  }

  return `${todayPrefix}${String(next).padStart(3, '0')}`
}

function mapRow(row: unknown): Quote {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    vehicle_id: r.vehicle_id as number,
    customer_id: r.customer_id as number,
    quote_number: r.quote_number as string,
    date: r.date as string,
    status: r.status as QuoteStatus,
    description: r.description as string | null,
    labor_hours: Number(r.labor_hours ?? 0),
    hourly_rate: Number(r.hourly_rate ?? 0),
    parts_cost: Number(r.parts_cost ?? 0),
    total_cost: Number(r.total_cost ?? 0),
    vat_rate: Number(r.vat_rate ?? 0.21),
    customer_total: Number(r.customer_total ?? r.total_cost ?? 0),
    workshop_total: Number(r.workshop_total ?? 0),
    notes: r.notes as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

export function list(filter?: QuoteFilter): Quote[] {
  const db = getDatabase()

  const sql = `
    SELECT * FROM quotes
    WHERE (? IS NULL OR customer_id = ?)
      AND (? IS NULL OR vehicle_id = ?)
      AND (? IS NULL OR status = ?)
    ORDER BY date DESC, id DESC
  `

  const customerId = filter?.customer_id ?? null
  const vehicleId = filter?.vehicle_id ?? null
  const status = filter?.status ?? null

  const rows = db.prepare(sql).all(customerId, customerId, vehicleId, vehicleId, status, status) as Record<string, unknown>[]
  return rows.map(mapRow)
}

export function getById(id: number): Quote | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id)
  return row ? mapRow(row) : undefined
}

export function create(data: QuoteCreate): Quote {
  const db = getDatabase()

  const date = data.date ?? new Date().toISOString().slice(0, 10)
  const hourlyRate = data.hourly_rate ?? getHourlyRate()
  const laborHours = data.labor_hours ?? 0
  const partsCost = data.parts_cost ?? 0
  const totalCost = calculateQuoteTotal({
    labor_hours: laborHours,
    hourly_rate: hourlyRate,
    parts_cost: partsCost
  })

  const quoteNumber = generateNumber(db, 'Q')

  const result = db
    .prepare(
      `
      INSERT INTO quotes (vehicle_id, customer_id, quote_number, date, status, description, labor_hours, hourly_rate, parts_cost, total_cost, notes)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      data.vehicle_id,
      data.customer_id,
      quoteNumber,
      date,
      data.description ?? null,
      laborHours,
      hourlyRate,
      partsCost,
      totalCost,
      data.notes ?? null
    )

  const quote = getById(Number(result.lastInsertRowid))
  if (!quote) {
    throw new Error('Failed to create quote')
  }
  return quote
}

export function update(id: number, data: QuoteUpdate): Quote {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Quote ${id} not found`)
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft quotes can be edited')
  }

  const vehicleId = 'vehicle_id' in data ? data.vehicle_id : existing.vehicle_id
  const customerId = 'customer_id' in data ? data.customer_id : existing.customer_id
  const date = 'date' in data ? data.date : existing.date
  const description = 'description' in data ? data.description : existing.description
  const laborHours = 'labor_hours' in data ? data.labor_hours : existing.labor_hours
  const hourlyRate = 'hourly_rate' in data ? data.hourly_rate : existing.hourly_rate
  const partsCost = 'parts_cost' in data ? data.parts_cost : existing.parts_cost
  const notes = 'notes' in data ? data.notes : existing.notes
  const status = 'status' in data ? data.status : existing.status

  const totalCost = calculateQuoteTotal({
    labor_hours: laborHours ?? 0,
    hourly_rate: hourlyRate ?? 0,
    parts_cost: partsCost ?? 0
  })

  const result = db
    .prepare(
      `
      UPDATE quotes
      SET vehicle_id = ?,
          customer_id = ?,
          date = ?,
          description = ?,
          labor_hours = ?,
          hourly_rate = ?,
          parts_cost = ?,
          total_cost = ?,
          notes = ?,
          status = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(
      vehicleId ?? existing.vehicle_id,
      customerId ?? existing.customer_id,
      date,
      description ?? null,
      laborHours ?? 0,
      hourlyRate ?? 0,
      partsCost ?? 0,
      totalCost,
      notes ?? null,
      status,
      id
    )

  if (result.changes === 0) {
    throw new Error(`Quote ${id} not updated`)
  }

  const quote = getById(id)
  if (!quote) {
    throw new Error(`Quote ${id} disappeared after update`)
  }
  return quote
}

export function remove(id: number): void {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Quote ${id} not found`)
  }

  if (existing.status === 'converted') {
    throw new Error('Cannot delete a converted quote')
  }

  const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Quote ${id} not found`)
  }
}

export function convert(id: number): WorkOrder {
  const db = getDatabase()

  const quote = getById(id)
  if (!quote) {
    throw new Error(`Quote ${id} not found`)
  }

  if (quote.status !== 'accepted') {
    throw new Error('Only accepted quotes can be converted')
  }

  const today = new Date().toISOString().slice(0, 10)
  const orderNumber = generateNumber(db, 'WO')

  const insertWorkOrder = db.prepare(
    `
    INSERT INTO work_orders (
      vehicle_id, customer_id, quote_id, order_number, date_in, description,
      labor_hours, hourly_rate, parts_cost, total_cost, payment_status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `
  )

  const updateQuote = db.prepare(
    `
    UPDATE quotes SET status = 'converted', updated_at = datetime('now') WHERE id = ?
  `
  )

  const transaction = db.transaction(() => {
    const result = insertWorkOrder.run(
      quote.vehicle_id,
      quote.customer_id,
      quote.id,
      orderNumber,
      today,
      quote.description,
      quote.labor_hours,
      quote.hourly_rate,
      quote.parts_cost,
      quote.total_cost,
      quote.notes
    )

    updateQuote.run(id)

    return Number(result.lastInsertRowid)
  })

  const workOrderId = transaction()

  const row = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(workOrderId) as Record<string, unknown>
  if (!row) {
    throw new Error('Failed to convert quote')
  }

  return {
    id: row.id as number,
    vehicle_id: row.vehicle_id as number,
    customer_id: row.customer_id as number,
    quote_id: row.quote_id as number | null,
    order_number: row.order_number as string,
    date_in: row.date_in as string,
    date_out: row.date_out as string | null,
    mileage_in: row.mileage_in as number | null,
    mileage_out: row.mileage_out as number | null,
    description: row.description as string | null,
    labor_hours: Number(row.labor_hours ?? 0),
    hourly_rate: Number(row.hourly_rate ?? 0),
    parts_cost: Number(row.parts_cost ?? 0),
    total_cost: Number(row.total_cost ?? 0),
    vat_rate: Number(row.vat_rate ?? 0.21),
    customer_total: Number(row.customer_total ?? row.total_cost ?? 0),
    workshop_total: Number(row.workshop_total ?? 0),
    payment_status: row.payment_status as 'pending' | 'partial' | 'paid',
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  }
}

export const quoteRepository = {
  list,
  getById,
  create,
  update,
  delete: remove,
  convert
}
