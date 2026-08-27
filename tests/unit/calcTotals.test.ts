import { describe, it, expect } from 'vitest'
import { calcTotals } from '../../src/shared/calcTotals'

describe('calcTotals', () => {
  it('calculates VAT for a single parts item', () => {
    const totals = calcTotals(
      [{ description: 'Brake pads', quantity: 1, customer_price: 100, workshop_price: 70, item_type: 'parts' }],
      0,
      0,
      0.21
    )

    expect(totals.customer_subtotal).toBe(100)
    expect(totals.workshop_subtotal).toBe(70)
    expect(totals.vat_amount).toBe(21)
    expect(totals.customer_total).toBe(121)
    expect(totals.workshop_total).toBe(84.7)
    expect(totals.net_profit).toBe(36.3)
  })

  it('multiplies by quantity', () => {
    const totals = calcTotals(
      [{ description: 'Oil', quantity: 3, customer_price: 20, workshop_price: 12, item_type: 'parts' }],
      0,
      0,
      0.21
    )

    expect(totals.customer_subtotal).toBe(60)
    expect(totals.workshop_subtotal).toBe(36)
    expect(totals.customer_total).toBe(72.6)
    expect(totals.workshop_total).toBe(43.56)
    expect(totals.net_profit).toBe(29.04)
  })

  it('adds document-level labor without VAT', () => {
    const totals = calcTotals(
      [{ description: 'Filter', quantity: 1, customer_price: 30, workshop_price: 15, item_type: 'parts' }],
      2,
      50,
      0.21
    )

    expect(totals.labor_subtotal).toBe(100)
    expect(totals.customer_subtotal).toBe(30) // parts only
    expect(totals.customer_total).toBe(136.3) // 30 * 1.21 + 100
    expect(totals.workshop_total).toBe(18.15)
    expect(totals.parts_total).toBe(36.3) // 30 * 1.21
    expect(totals.net_profit).toBe(118.15) // 100 + 36.3 - 18.15
  })

  it('treats labor line items with hourly_rate and no workshop cost, no VAT on labor', () => {
    const totals = calcTotals(
      [
        { description: 'Parts', quantity: 1, customer_price: 100, workshop_price: 60, item_type: 'parts' },
        { description: 'Labor', quantity: 1.5, customer_price: 0, workshop_price: 0, item_type: 'labor' }
      ],
      0,
      40,
      0.21
    )

    expect(totals.labor_subtotal).toBe(60)
    expect(totals.customer_subtotal).toBe(100) // parts only
    expect(totals.workshop_subtotal).toBe(60)
    expect(totals.customer_total).toBe(181) // 100 * 1.21 + 60
    expect(totals.workshop_total).toBe(72.6)
    expect(totals.parts_total).toBe(121) // 100 * 1.21
    expect(totals.net_profit).toBe(108.4) // 60 + 121 - 72.6
  })

  it('handles zero quantity and zero price', () => {
    const totals = calcTotals(
      [{ description: 'Freebie', quantity: 0, customer_price: 50, workshop_price: 30, item_type: 'parts' }],
      0,
      0,
      0.21
    )

    expect(totals.customer_subtotal).toBe(0)
    expect(totals.workshop_subtotal).toBe(0)
    expect(totals.customer_total).toBe(0)
    expect(totals.net_profit).toBe(0)
  })

  it('handles 0% VAT', () => {
    const totals = calcTotals(
      [{ description: 'Service', quantity: 1, customer_price: 100, workshop_price: 60, item_type: 'parts' }],
      1,
      50,
      0
    )

    expect(totals.customer_total).toBe(150)
    expect(totals.workshop_total).toBe(60)
    expect(totals.net_profit).toBe(90)
    expect(totals.vat_amount).toBe(0)
  })

  it('handles mixed parts and labor items with VAT only on parts', () => {
    const totals = calcTotals(
      [
        { description: 'Pads', quantity: 2, customer_price: 45, workshop_price: 30, item_type: 'parts' },
        { description: 'Diagnosis', quantity: 0.5, customer_price: 0, workshop_price: 0, item_type: 'labor' }
      ],
      1,
      60,
      0.21
    )

    expect(totals.labor_subtotal).toBe(90) // 0.5*60 + 1*60
    expect(totals.customer_subtotal).toBe(90) // parts only: 2*45
    expect(totals.workshop_subtotal).toBe(60) // parts only: 2*30
    expect(totals.customer_total).toBe(198.9) // 90 * 1.21 + 90
    expect(totals.workshop_total).toBe(72.6) // 60 * 1.21
    expect(totals.parts_total).toBe(108.9) // 90 * 1.21
    expect(totals.net_profit).toBe(126.3) // 90 + 108.9 - 72.6
  })
})
