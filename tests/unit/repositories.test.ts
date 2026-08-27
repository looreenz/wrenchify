import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { setDatabase } from '../../src/db/connection'
import * as customerRepository from '../../src/db/repositories/customerRepository'
import * as vehicleRepository from '../../src/db/repositories/vehicleRepository'
import * as quoteRepository from '../../src/db/repositories/quoteRepository'
import * as workOrderRepository from '../../src/db/repositories/workOrderRepository'
import * as paymentRepository from '../../src/db/repositories/paymentRepository'
import * as settingsRepository from '../../src/db/repositories/settingsRepository'

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

describe('settings repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('returns default settings on empty database', () => {
    const settings = settingsRepository.getAll()
    expect(settings.hourly_rate).toBe(45)
    expect(settings.default_language).toBe('it')
    expect(settings.shop_name).toBe('Wrenchify')
    expect(settings.currency).toBe('EUR')
    expect(settings.vat_rate).toBe(0.21)
  })

  it('updates and persists settings', () => {
    settingsRepository.update('hourly_rate', '55')
    settingsRepository.update('shop_name', 'Officina Rossi')
    settingsRepository.update('default_language', 'es')
    settingsRepository.update('vat_rate', '0.22')

    const settings = settingsRepository.getAll()
    expect(settings.hourly_rate).toBe(55)
    expect(settings.shop_name).toBe('Officina Rossi')
    expect(settings.default_language).toBe('es')
    expect(settings.vat_rate).toBe(0.22)
  })

  it('returns the configured VAT rate', () => {
    settingsRepository.update('vat_rate', '0.10')
    expect(settingsRepository.getVatRate()).toBe(0.10)
  })

  it('rejects negative hourly rate', () => {
    expect(() => settingsRepository.update('hourly_rate', '-1')).toThrow()
  })

  it('rejects invalid language', () => {
    expect(() => settingsRepository.update('default_language', 'en')).toThrow()
  })

  it('rejects shop names over 100 characters', () => {
    expect(() => settingsRepository.update('shop_name', 'a'.repeat(101))).toThrow()
  })

  it('rejects VAT rate outside 0..1', () => {
    expect(() => settingsRepository.update('vat_rate', '-0.01')).toThrow()
    expect(() => settingsRepository.update('vat_rate', '1.01')).toThrow()
  })
})

describe('customer repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('creates and lists customers', () => {
    seedCustomer()
    const customers = customerRepository.list()
    expect(customers).toHaveLength(1)
    expect(customers[0].last_name).toBe('Rossi')
  })

  it('searches customers case-insensitively', () => {
    seedCustomer()
    customerRepository.create({ last_name: 'Bianchi' })
    expect(customerRepository.list('rossi')).toHaveLength(1)
    expect(customerRepository.list('bianchi')).toHaveLength(1)
  })

  it('validates email format', () => {
    expect(() =>
      customerRepository.create({ last_name: 'Test', email: 'not-an-email' })
    ).toThrow()
  })

  it('cascades delete to vehicles', () => {
    const customer = seedCustomer()
    seedVehicle(customer.id)
    customerRepository.remove(customer.id)
    expect(vehicleRepository.list()).toHaveLength(0)
  })
})

describe('vehicle repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('stores license plate uppercase', () => {
    const customer = seedCustomer()
    const vehicle = vehicleRepository.create({
      customer_id: customer.id,
      license_plate: 'ab456cd',
      model: 'Corsa'
    })
    expect(vehicle.license_plate).toBe('AB456CD')
  })

  it('enforces unique license plates', () => {
    const customer = seedCustomer()
    seedVehicle(customer.id)
    expect(() => seedVehicle(customer.id)).toThrow()
  })

  it('validates year range', () => {
    const customer = seedCustomer()
    expect(() =>
      vehicleRepository.create({
        customer_id: customer.id,
        license_plate: 'ZZ999ZZ',
        model: 'Test',
        year: 1899
      })
    ).toThrow()
  })

  it('blocks deletion when work orders exist', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 40
    })
    expect(() => vehicleRepository.remove(vehicle.id)).toThrow()
  })
})

describe('quote repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('generates auto-numbered quotes per day', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const first = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })
    const second = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    expect(first.quote_number).toMatch(/^Q-\d{8}-001$/)
    expect(second.quote_number).toMatch(/^Q-\d{8}-002$/)
  })

  it('snapshots vat_rate and computes dual totals from line items', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const quote = quoteRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 2,
      hourly_rate: 50
    })

    expect(quote.vat_rate).toBe(0.21)

    quoteRepository.addLineItem(quote.id, {
      description: 'Brake pads',
      quantity: 2,
      customer_price: 45,
      workshop_price: 30,
      item_type: 'parts'
    })

    const updated = quoteRepository.getById(quote.id)
    // labor 2 * 50 = 100 + parts 2 * 45 = 90 => parts with VAT: 90 * 1.21 = 108.9; customer_total = 100 + 108.9 = 208.9
    expect(updated?.customer_total).toBe(208.9)
    // workshop parts 2 * 30 = 60 * 1.21 = 72.6
    expect(updated?.workshop_total).toBe(72.6)
  })

  it('rejects negative or invalid line item input', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    expect(() =>
      quoteRepository.addLineItem(quote.id, {
        description: 'Bad',
        quantity: -1,
        customer_price: 10,
        workshop_price: 5,
        item_type: 'parts'
      })
    ).toThrow()

    expect(() =>
      quoteRepository.addLineItem(quote.id, {
        description: 'Bad',
        quantity: 1,
        customer_price: -10,
        workshop_price: 5,
        item_type: 'parts'
      })
    ).toThrow()
  })

  it('only allows editing draft quotes', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    quoteRepository.update(quote.id, { status: 'accepted' })
    expect(() => quoteRepository.update(quote.id, { labor_hours: 5 })).toThrow()
  })

  it('converts an accepted quote into a work order carrying line items and totals', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 2,
      hourly_rate: 50
    })

    quoteRepository.addLineItem(quote.id, {
      description: 'Brake pads',
      quantity: 1,
      customer_price: 100,
      workshop_price: 70,
      item_type: 'parts'
    })

    const accepted = quoteRepository.update(quote.id, { status: 'accepted' })
    const workOrder = quoteRepository.convert(quote.id)

    expect(workOrder.quote_id).toBe(quote.id)
    expect(workOrder.vat_rate).toBe(accepted.vat_rate)
    expect(workOrder.customer_total).toBe(accepted.customer_total)
    expect(workOrder.workshop_total).toBe(accepted.workshop_total)
    expect(quoteRepository.getById(quote.id)?.status).toBe('converted')

    const workOrderItems = workOrderRepository.getLineItems(workOrder.id)
    expect(workOrderItems).toHaveLength(1)
    expect(workOrderItems[0].description).toBe('Brake pads')
    expect(workOrderItems[0].customer_price).toBe(100)
    expect(workOrderItems[0].workshop_price).toBe(70)
  })

  it('rejects conversion of non-accepted quotes', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    expect(() => quoteRepository.convert(quote.id)).toThrow()
  })
})

describe('work order repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('generates auto-numbered work orders per day', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const first = workOrderRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })
    const second = workOrderRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    expect(first.order_number).toMatch(/^WO-\d{8}-001$/)
    expect(second.order_number).toMatch(/^WO-\d{8}-002$/)
  })

  it('recalculates dual totals when dual-priced line items change', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 40
    })

    // labor 1 * 40 = 40 (no VAT on labor)
    expect(workOrder.customer_total).toBe(40)
    expect(workOrder.workshop_total).toBe(0)

    workOrderRepository.addLineItem(workOrder.id, {
      description: 'Oil filter',
      quantity: 2,
      customer_price: 15,
      workshop_price: 10,
      item_type: 'parts'
    })

    const updated = workOrderRepository.getById(workOrder.id)
    // labor 40 + parts 2 * 15 = 30 => parts with VAT: 30 * 1.21 = 36.3; customer_total = 40 + 36.3 = 76.3
    expect(updated?.customer_total).toBe(76.3)
    // workshop parts 2 * 10 = 20 * 1.21 = 24.2
    expect(updated?.workshop_total).toBe(24.2)
  })

  it('treats labor line items without workshop cost', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 0,
      hourly_rate: 60
    })

    workOrderRepository.addLineItem(workOrder.id, {
      description: 'Diagnosis',
      quantity: 1.5,
      customer_price: 0,
      workshop_price: 0,
      item_type: 'labor'
    })

    const updated = workOrderRepository.getById(workOrder.id)
    // labor 1.5 * 60 = 90 (no VAT on labor)
    expect(updated?.customer_total).toBe(90)
    expect(updated?.workshop_total).toBe(0)
  })

  it('validates mileage out greater than mileage in', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    expect(() =>
      workOrderRepository.create({
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        mileage_in: 10000,
        mileage_out: 9999
      })
    ).toThrow()
  })

  it('blocks line item edits on paid work orders', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 100
    })

    paymentRepository.create({
      work_order_id: workOrder.id,
      amount: 121,
      payment_method: 'cash'
    })

    expect(() =>
      workOrderRepository.addLineItem(workOrder.id, {
        description: 'Extra',
        quantity: 1,
        customer_price: 10,
        workshop_price: 5,
        item_type: 'parts'
      })
    ).toThrow()
  })
})

describe('payment repository', () => {
  beforeEach(() => {
    createTestDatabase()
  })

  it('recalculates payment status to paid', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 100
    })

    paymentRepository.create({
      work_order_id: workOrder.id,
      amount: 121,
      payment_method: 'cash'
    })

    const updated = workOrderRepository.getById(workOrder.id)
    expect(updated?.payment_status).toBe('paid')
  })

  it('blocks payments on paid work orders', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 100
    })

    paymentRepository.create({
      work_order_id: workOrder.id,
      amount: 121,
      payment_method: 'cash'
    })

    expect(() =>
      paymentRepository.create({
        work_order_id: workOrder.id,
        amount: 10,
        payment_method: 'cash'
      })
    ).toThrow()
  })

  it('rejects future payment dates', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id
    })

    const future = new Date()
    future.setDate(future.getDate() + 1)

    expect(() =>
      paymentRepository.create({
        work_order_id: workOrder.id,
        amount: 10,
        payment_method: 'cash',
        payment_date: future.toISOString().slice(0, 10)
      })
    ).toThrow()
  })
})
