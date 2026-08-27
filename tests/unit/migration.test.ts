import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadMigration(filename: string): string {
  return readFileSync(join(__dirname, `../../src/db/migrations/${filename}`), 'utf-8')
}

function createMigratedDatabase(): Database.Database {
  const db = new Database(':memory:')

  db.exec(loadMigration('001_initial.sql'))

  // Seed minimal data in the legacy schema
  db.exec(`
    INSERT INTO customers (last_name, phone) VALUES ('Rossi', '123');
    INSERT INTO vehicles (customer_id, license_plate, model) VALUES (1, 'AA123BB', 'Panda');
    INSERT INTO quotes (vehicle_id, customer_id, quote_number, date, labor_hours, hourly_rate, parts_cost, total_cost)
    VALUES (1, 1, 'Q-20260101-001', '2026-01-01', 2, 50, 100, 200);
    INSERT INTO work_orders (vehicle_id, customer_id, order_number, date_in, labor_hours, hourly_rate, parts_cost, total_cost)
    VALUES (1, 1, 'WO-20260101-001', '2026-01-01', 1, 40, 20, 60);
    INSERT INTO work_order_items (work_order_id, description, quantity, unit_price, item_type)
    VALUES (1, 'Oil filter', 2, 15, 'parts');
  `)

  db.exec(loadMigration('002_dual_pricing.sql'))

  return db
}

function tableColumns(db: Database.Database, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((col) => col.name)
}

describe('002_dual_pricing migration', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createMigratedDatabase()
  })

  it('creates the quote_items table', () => {
    const columns = tableColumns(db, 'quote_items')
    expect(columns).toContain('id')
    expect(columns).toContain('quote_id')
    expect(columns).toContain('description')
    expect(columns).toContain('quantity')
    expect(columns).toContain('customer_price')
    expect(columns).toContain('workshop_price')
    expect(columns).toContain('item_type')
  })

  it('replaces unit_price with dual prices on work_order_items', () => {
    const columns = tableColumns(db, 'work_order_items')
    expect(columns).toContain('customer_price')
    expect(columns).toContain('workshop_price')
    expect(columns).not.toContain('unit_price')
  })

  it('backfills work_order_items customer_price from unit_price', () => {
    const item = db.prepare('SELECT * FROM work_order_items WHERE id = 1').get() as {
      customer_price: number
      workshop_price: number
    }
    expect(item.customer_price).toBe(15)
    expect(item.workshop_price).toBe(0)
  })

  it('replaces quote parts_cost/total_cost with vat_rate and dual totals', () => {
    const columns = tableColumns(db, 'quotes')
    expect(columns).toContain('vat_rate')
    expect(columns).toContain('customer_total')
    expect(columns).toContain('workshop_total')
    expect(columns).not.toContain('parts_cost')
    expect(columns).not.toContain('total_cost')
  })

  it('replaces work_order parts_cost/total_cost with vat_rate and dual totals', () => {
    const columns = tableColumns(db, 'work_orders')
    expect(columns).toContain('vat_rate')
    expect(columns).toContain('customer_total')
    expect(columns).toContain('workshop_total')
    expect(columns).not.toContain('parts_cost')
    expect(columns).not.toContain('total_cost')
  })

  it('migrates quote parts_cost into a synthetic quote_item', () => {
    const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = 1').all() as Array<{
      description: string
      quantity: number
      customer_price: number
      workshop_price: number
      item_type: string
    }>
    expect(items).toHaveLength(1)
    expect(items[0].description).toBe('Parts')
    expect(items[0].quantity).toBe(1)
    expect(items[0].customer_price).toBe(100)
    expect(items[0].workshop_price).toBe(0)
    expect(items[0].item_type).toBe('parts')
  })

  it('computes quote totals including VAT', () => {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = 1').get() as {
      vat_rate: number
      customer_total: number
      workshop_total: number
    }
    expect(quote.vat_rate).toBe(0.21)
    // labor 2 * 50 = 100 + parts 100 = 200 subtotal; * 1.21 = 242
    expect(quote.customer_total).toBe(242)
    // workshop parts 0 * 1.21 = 0
    expect(quote.workshop_total).toBe(0)
  })

  it('computes work order totals including VAT', () => {
    const order = db.prepare('SELECT * FROM work_orders WHERE id = 1').get() as {
      vat_rate: number
      customer_total: number
      workshop_total: number
    }
    expect(order.vat_rate).toBe(0.21)
    // labor 1 * 40 = 40 + parts 2 * 15 = 30 => 70 subtotal; * 1.21 = 84.7
    expect(order.customer_total).toBe(84.7)
    // workshop parts 0 * 1.21 = 0
    expect(order.workshop_total).toBe(0)
  })

  it('seeds the default vat_rate setting', () => {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'vat_rate'").get() as { value: string }
    expect(row.value).toBe('0.21')
  })
})
