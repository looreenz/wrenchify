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

function createTestDatabase(): Database.Database {
  const database = new Database(':memory:')
  setDatabase(database)

  const schemaPath = join(__dirname, '../../src/db/migrations/001_initial.sql')
  const schema = readFileSync(schemaPath, 'utf-8')
  database.exec(schema)

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
  })

  it('updates and persists settings', () => {
    settingsRepository.update('hourly_rate', '55')
    settingsRepository.update('shop_name', 'Officina Rossi')
    settingsRepository.update('default_language', 'es')

    const settings = settingsRepository.getAll()
    expect(settings.hourly_rate).toBe(55)
    expect(settings.shop_name).toBe('Officina Rossi')
    expect(settings.default_language).toBe('es')
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

  it('calculates total cost', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)

    const quote = quoteRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 2,
      hourly_rate: 50,
      parts_cost: 30
    })

    expect(quote.total_cost).toBe(130)
  })

  it('only allows editing draft quotes', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({ customer_id: customer.id, vehicle_id: vehicle.id })

    quoteRepository.update(quote.id, { status: 'accepted' })
    expect(() => quoteRepository.update(quote.id, { labor_hours: 5 })).toThrow()
  })

  it('converts an accepted quote into a work order', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const quote = quoteRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 2,
      hourly_rate: 50,
      parts_cost: 30
    })

    quoteRepository.update(quote.id, { status: 'accepted' })
    const workOrder = quoteRepository.convert(quote.id)

    expect(workOrder.quote_id).toBe(quote.id)
    expect(workOrder.total_cost).toBe(quote.total_cost)
    expect(workOrder.hourly_rate).toBe(quote.hourly_rate)
    expect(quoteRepository.getById(quote.id)?.status).toBe('converted')
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

  it('recalculates total cost when line items change', () => {
    const customer = seedCustomer()
    const vehicle = seedVehicle(customer.id)
    const workOrder = workOrderRepository.create({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      labor_hours: 1,
      hourly_rate: 40,
      parts_cost: 10
    })

    expect(workOrder.total_cost).toBe(50)

    workOrderRepository.addLineItem(workOrder.id, {
      description: 'Oil filter',
      quantity: 2,
      unit_price: 15,
      item_type: 'parts'
    })

    const updated = workOrderRepository.getById(workOrder.id)
    expect(updated?.total_cost).toBe(80)
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
      amount: 100,
      payment_method: 'cash'
    })

    expect(() =>
      workOrderRepository.addLineItem(workOrder.id, {
        description: 'Extra',
        quantity: 1,
        unit_price: 10
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
      amount: 100,
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
      amount: 100,
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
