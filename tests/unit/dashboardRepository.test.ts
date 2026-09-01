import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDatabase } from '../../src/db/connection'
import * as customerRepository from '../../src/db/repositories/customerRepository'
import * as vehicleRepository from '../../src/db/repositories/vehicleRepository'
import * as dashboardRepository from '../../src/db/repositories/dashboardRepository'

function loadMigration(filename: string): string {
  return readFileSync(join(__dirname, `../../src/db/migrations/${filename}`), 'utf-8')
}

function createTestDatabase(): Database.Database {
  const database = new Database(':memory:')
  setDatabase(database)

  database.exec(loadMigration('001_initial.sql'))
  database.exec(loadMigration('002_dual_pricing.sql'))

  return database
}

function seedCustomer(): ReturnType<typeof customerRepository.create> {
  return customerRepository.create({ last_name: 'Rossi', first_name: 'Mario' })
}

function seedVehicle(customerId: number): ReturnType<typeof vehicleRepository.create> {
  return vehicleRepository.create({
    customer_id: customerId,
    license_plate: 'AA123BB',
    make: 'Fiat',
    model: 'Panda'
  })
}

describe('dashboard repository', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDatabase()
  })

  it('aggregates profit and revenue for the selected period', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO work_orders (
        vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total, payment_status
      ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 'pending')`
    )

    stmt.run(vehicle.id, customer.id, 'WO-20260115-001', '2026-01-15', 500, 300)
    stmt.run(vehicle.id, customer.id, 'WO-20260120-001', '2026-01-20', 200, 100)
    stmt.run(vehicle.id, customer.id, 'WO-20260125-001', '2026-01-25', 800, 600)

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.revenue.current).toBe(1500)
    expect(kpis.profit.current).toBe(500)
    expect(kpis.revenue.previous).toBeNull()
    expect(kpis.profit.previous).toBeNull()
  })

  it('counts pending work orders regardless of date range', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO work_orders (
        vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total, payment_status
      ) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, ?)`
    )

    stmt.run(vehicle.id, customer.id, 'WO-20250101-001', '2025-01-01', 'pending')
    stmt.run(vehicle.id, customer.id, 'WO-20250102-001', '2025-01-02', 'pending')
    stmt.run(vehicle.id, customer.id, 'WO-20250103-001', '2025-01-03', 'partial')
    stmt.run(vehicle.id, customer.id, 'WO-20250104-001', '2025-01-04', 'paid')

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.pendingWorkOrders.count).toBe(2)
  })

  it('calculates quote conversion rate for the period', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO quotes (
        vehicle_id, customer_id, quote_number, date, status, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total
      ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0)`
    )

    stmt.run(vehicle.id, customer.id, 'Q-20260105-001', '2026-01-05', 'draft')
    stmt.run(vehicle.id, customer.id, 'Q-20260106-001', '2026-01-06', 'draft')
    stmt.run(vehicle.id, customer.id, 'Q-20260107-001', '2026-01-07', 'draft')
    stmt.run(vehicle.id, customer.id, 'Q-20260108-001', '2026-01-08', 'accepted')
    stmt.run(vehicle.id, customer.id, 'Q-20260109-001', '2026-01-09', 'accepted')
    stmt.run(vehicle.id, customer.id, 'Q-20260110-001', '2026-01-10', 'rejected')
    stmt.run(vehicle.id, customer.id, 'Q-20260111-001', '2026-01-11', 'converted')
    stmt.run(vehicle.id, customer.id, 'Q-20260112-001', '2026-01-12', 'converted')
    stmt.run(vehicle.id, customer.id, 'Q-20260113-001', '2026-01-13', 'converted')
    stmt.run(vehicle.id, customer.id, 'Q-20260114-001', '2026-01-14', 'converted')

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.conversionRate.current).toBe(60)
  })

  it('returns null conversion rate when no quotes exist', () => {
    seedCustomer()
    seedVehicle(1)

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.conversionRate.current).toBeNull()
    expect(kpis.conversionRate.previous).toBeNull()
    expect(kpis.conversionRate.delta).toBeNull()
  })

  it('zero-fills revenue trend across year boundaries', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO work_orders (
        vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total, payment_status
      ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 'pending')`
    )

    stmt.run(vehicle.id, customer.id, 'WO-20251110-001', '2025-11-10', 500, 300)
    stmt.run(vehicle.id, customer.id, 'WO-20260105-001', '2026-01-05', 800, 400)

    const trend = dashboardRepository.getRevenueTrend('2026-01-15')

    expect(trend).toHaveLength(12)

    const november = trend.find((point) => point.month === '2025-11')
    const december = trend.find((point) => point.month === '2025-12')
    const january = trend.find((point) => point.month === '2026-01')

    expect(november?.revenue).toBe(500)
    expect(december?.revenue).toBe(0)
    expect(january?.revenue).toBe(800)
  })

  it('returns null previous period values when no prior data exists', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO work_orders (
        vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total, payment_status
      ) VALUES (?, ?, ?, ?, 0, 0, 0, 100, 50, 'pending')`
    )

    stmt.run(vehicle.id, customer.id, 'WO-20260115-001', '2026-01-15')

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.profit.previous).toBeNull()
    expect(kpis.profit.delta).toBeNull()
    expect(kpis.profit.deltaPercent).toBeNull()
    expect(kpis.revenue.previous).toBeNull()
    expect(kpis.conversionRate.previous).toBeNull()
  })

  it('computes previous period profit and revenue for month-over-month comparison', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const stmt = db.prepare(
      `INSERT INTO work_orders (
        vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, vat_rate,
        customer_total, workshop_total, payment_status
      ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, 'pending')`
    )

    stmt.run(vehicle.id, customer.id, 'WO-20260110-001', '2026-01-10', 1000, 600)
    stmt.run(vehicle.id, customer.id, 'WO-20251210-001', '2025-12-10', 400, 200)

    const kpis = dashboardRepository.getKPIs('2026-01-01', '2026-01-31')

    expect(kpis.revenue.current).toBe(1000)
    expect(kpis.revenue.previous).toBe(400)
    expect(kpis.revenue.delta).toBe(600)
    expect(kpis.profit.current).toBe(400)
    expect(kpis.profit.previous).toBe(200)
    expect(kpis.profit.delta).toBe(200)
  })
})
