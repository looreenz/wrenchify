import type { Database } from 'better-sqlite3'
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerWithVehicleCount
} from '../../shared/types'
import { getDatabase } from '../connection'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCustomer(data: CustomerCreate | CustomerUpdate): void {
  if ('last_name' in data && data.last_name !== undefined && data.last_name.trim() === '') {
    throw new Error('Last name is required')
  }

  if ('email' in data && data.email && !EMAIL_REGEX.test(data.email)) {
    throw new Error('Invalid email format')
  }
}

function mapRow(row: unknown): Customer {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    first_name: r.first_name as string | null,
    last_name: r.last_name as string,
    phone: r.phone as string | null,
    email: r.email as string | null,
    address: r.address as string | null,
    fiscal_code: r.fiscal_code as string | null,
    notes: r.notes as string | null,
    preferred_language: r.preferred_language as 'it' | 'es',
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

export function list(search?: string): CustomerWithVehicleCount[] {
  const db = getDatabase()

  const sql = `
    SELECT c.*, COUNT(v.id) AS vehicle_count
    FROM customers c
    LEFT JOIN vehicles v ON v.customer_id = c.id
    WHERE (? IS NULL OR (
      LOWER(c.first_name) LIKE LOWER('%' || ? || '%') OR
      LOWER(c.last_name) LIKE LOWER('%' || ? || '%') OR
      LOWER(c.phone) LIKE LOWER('%' || ? || '%') OR
      LOWER(c.email) LIKE LOWER('%' || ? || '%')
    ))
    GROUP BY c.id
    ORDER BY c.last_name, c.first_name
  `

  const term = search?.trim() || null
  const rows = db.prepare(sql).all(term, term, term, term, term) as Record<string, unknown>[]

  return rows.map((r) => ({
    ...mapRow(r),
    vehicle_count: Number(r.vehicle_count ?? 0)
  }))
}

export function getById(id: number): Customer | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
  return row ? mapRow(row) : undefined
}

export function create(data: CustomerCreate): Customer {
  const db = getDatabase()
  validateCustomer(data)

  const firstName = data.first_name ?? null
  const preferredLanguage = data.preferred_language ?? 'it'

  const result = db
    .prepare(
      `
      INSERT INTO customers (first_name, last_name, phone, email, address, fiscal_code, notes, preferred_language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      firstName,
      data.last_name,
      data.phone ?? null,
      data.email ?? null,
      data.address ?? null,
      data.fiscal_code ?? null,
      data.notes ?? null,
      preferredLanguage
    )

  const customer = getById(Number(result.lastInsertRowid))
  if (!customer) {
    throw new Error('Failed to create customer')
  }
  return customer
}

export function update(id: number, data: CustomerUpdate): Customer {
  const db = getDatabase()
  validateCustomer(data)

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Customer ${id} not found`)
  }

  const firstName = 'first_name' in data ? data.first_name : existing.first_name
  const lastName = 'last_name' in data ? data.last_name : existing.last_name
  const phone = 'phone' in data ? data.phone : existing.phone
  const email = 'email' in data ? data.email : existing.email
  const address = 'address' in data ? data.address : existing.address
  const fiscalCode = 'fiscal_code' in data ? data.fiscal_code : existing.fiscal_code
  const notes = 'notes' in data ? data.notes : existing.notes
  const preferredLanguage = 'preferred_language' in data ? data.preferred_language : existing.preferred_language

  const result = db
    .prepare(
      `
      UPDATE customers
      SET first_name = ?,
          last_name = ?,
          phone = ?,
          email = ?,
          address = ?,
          fiscal_code = ?,
          notes = ?,
          preferred_language = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(firstName ?? null, lastName, phone ?? null, email ?? null, address ?? null, fiscalCode ?? null, notes ?? null, preferredLanguage, id)

  if (result.changes === 0) {
    throw new Error(`Customer ${id} not updated`)
  }

  const customer = getById(id)
  if (!customer) {
    throw new Error(`Customer ${id} disappeared after update`)
  }
  return customer
}

export function remove(id: number): void {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM customers WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Customer ${id} not found`)
  }
}

export const customerRepository = {
  list,
  getById,
  create,
  update,
  delete: remove
}
