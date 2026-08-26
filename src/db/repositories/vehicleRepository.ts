import type { Database } from 'better-sqlite3'
import type {
  Vehicle,
  VehicleCreate,
  VehicleUpdate,
  VehicleFilter,
  VehicleTimelineEntry
} from '../../shared/types'
import { getDatabase } from '../connection'

const CURRENT_YEAR = new Date().getFullYear()

function normalizeLicensePlate(value: string): string {
  return value.trim().toUpperCase()
}

function validateVehicle(data: VehicleCreate | VehicleUpdate, isCreate = false): void {
  if (isCreate && (!data.license_plate || data.license_plate.trim() === '')) {
    throw new Error('License plate is required')
  }

  if (isCreate && data.customer_id === undefined) {
    throw new Error('Customer is required')
  }

  if ('model' in data && data.model !== undefined && data.model.trim() === '') {
    throw new Error('Model is required')
  }

  if (data.year !== undefined && data.year !== null && (data.year < 1900 || data.year > CURRENT_YEAR)) {
    throw new Error(`Year must be between 1900 and ${CURRENT_YEAR}`)
  }

  if (data.vin !== undefined && data.vin !== null && data.vin.length > 17) {
    throw new Error('VIN must be 17 characters or less')
  }
}

function mapRow(row: unknown): Vehicle {
  const r = row as Record<string, unknown>
  return {
    id: r.id as number,
    customer_id: r.customer_id as number,
    license_plate: r.license_plate as string,
    make: r.make as string | null,
    model: r.model as string,
    year: r.year as number | null,
    vin: r.vin as string | null,
    notes: r.notes as string | null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string
  }
}

export function list(filter?: VehicleFilter): Vehicle[] {
  const db = getDatabase()

  const sql = `
    SELECT * FROM vehicles
    WHERE (? IS NULL OR customer_id = ?)
    ORDER BY license_plate
  `

  const customerId = filter?.customer_id ?? null
  const rows = db.prepare(sql).all(customerId, customerId) as Record<string, unknown>[]
  return rows.map(mapRow)
}

export function getById(id: number): Vehicle | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id)
  return row ? mapRow(row) : undefined
}

export function create(data: VehicleCreate): Vehicle {
  const db = getDatabase()
  validateVehicle(data, true)

  const licensePlate = normalizeLicensePlate(data.license_plate)

  try {
    const result = db
      .prepare(
        `
        INSERT INTO vehicles (customer_id, license_plate, make, model, year, vin, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        data.customer_id,
        licensePlate,
        data.make ?? null,
        data.model,
        data.year ?? null,
        data.vin ?? null,
        data.notes ?? null
      )

    const vehicle = getById(Number(result.lastInsertRowid))
    if (!vehicle) {
      throw new Error('Failed to create vehicle')
    }
    return vehicle
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`License plate ${licensePlate} is already registered`)
    }
    throw error
  }
}

export function update(id: number, data: VehicleUpdate): Vehicle {
  const db = getDatabase()
  validateVehicle(data, false)

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Vehicle ${id} not found`)
  }

  const customerId = data.customer_id ?? existing.customer_id
  const licensePlate = data.license_plate !== undefined ? normalizeLicensePlate(data.license_plate) : existing.license_plate
  const make = ('make' in data ? data.make : existing.make) as string | null
  const model = data.model ?? existing.model
  const year = ('year' in data ? data.year : existing.year) as number | null
  const vin = ('vin' in data ? data.vin : existing.vin) as string | null
  const notes = ('notes' in data ? data.notes : existing.notes) as string | null

  try {
    const result = db
      .prepare(
        `
        UPDATE vehicles
        SET customer_id = ?,
            license_plate = ?,
            make = ?,
            model = ?,
            year = ?,
            vin = ?,
            notes = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `
      )
      .run(
        customerId ?? existing.customer_id,
        licensePlate,
        make ?? null,
        model,
        year ?? null,
        vin ?? null,
        notes ?? null,
        id
      )

    if (result.changes === 0) {
      throw new Error(`Vehicle ${id} not updated`)
    }

    const vehicle = getById(id)
    if (!vehicle) {
      throw new Error(`Vehicle ${id} disappeared after update`)
    }
    return vehicle
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error(`License plate ${licensePlate} is already registered`)
    }
    throw error
  }
}

export function remove(id: number): void {
  const db = getDatabase()

  const existing = getById(id)
  if (!existing) {
    throw new Error(`Vehicle ${id} not found`)
  }

  const workOrderCount = db.prepare('SELECT COUNT(*) AS count FROM work_orders WHERE vehicle_id = ?').get(id) as {
    count: number
  }
  if (workOrderCount.count > 0) {
    throw new Error('Cannot delete vehicle with existing work orders')
  }

  const result = db.prepare('DELETE FROM vehicles WHERE id = ?').run(id)
  if (result.changes === 0) {
    throw new Error(`Vehicle ${id} not found`)
  }
}

export function getTimeline(vehicleId: number): VehicleTimelineEntry[] {
  const db = getDatabase()

  const sql = `
    SELECT id, order_number, date_in, date_out, mileage_in, mileage_out, description, total_cost, payment_status
    FROM work_orders
    WHERE vehicle_id = ?
    ORDER BY date_in DESC, id DESC
  `

  const rows = db.prepare(sql).all(vehicleId) as Record<string, unknown>[]

  return rows.map((r) => ({
    id: r.id as number,
    order_number: r.order_number as string,
    date_in: r.date_in as string,
    date_out: (r.date_out as string | null) ?? null,
    mileage_in: (r.mileage_in as number | null) ?? null,
    mileage_out: (r.mileage_out as number | null) ?? null,
    description: (r.description as string | null) ?? null,
    total_cost: Number(r.total_cost ?? 0),
    payment_status: r.payment_status as 'pending' | 'partial' | 'paid'
  }))
}

export const vehicleRepository = {
  list,
  getById,
  create,
  update,
  delete: remove,
  getTimeline
}
