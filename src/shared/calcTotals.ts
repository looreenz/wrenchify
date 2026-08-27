import type { DocumentTotals, QuoteItem, WorkOrderItem } from './types'

type LineItem = Pick<QuoteItem | WorkOrderItem, 'quantity' | 'customer_price' | 'workshop_price' | 'item_type'>

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Pure function to calculate document totals from line items and labor.
 *
 * - Parts items use dual pricing (customer_price / workshop_price).
 * - Labor items use the document hourly_rate; workshop cost for labor is zero.
 * - Document-level labor_hours is added to the labor subtotal.
 * - VAT is applied to both customer and workshop subtotals.
 */
export function calcTotals(
  items: LineItem[],
  laborHours: number,
  hourlyRate: number,
  vatRate: number
): DocumentTotals {
  let partsCustomerSubtotal = 0
  let partsWorkshopSubtotal = 0
  let laborItemSubtotal = 0

  for (const item of items) {
    const quantity = item.quantity ?? 1

    if (item.item_type === 'labor') {
      laborItemSubtotal += hourlyRate * quantity
    } else {
      partsCustomerSubtotal += item.customer_price * quantity
      partsWorkshopSubtotal += item.workshop_price * quantity
    }
  }

  const documentLaborSubtotal = laborHours * hourlyRate
  const laborSubtotal = documentLaborSubtotal + laborItemSubtotal

  const customerSubtotal = partsCustomerSubtotal + laborSubtotal
  const workshopSubtotal = partsWorkshopSubtotal

  const customerTotal = round2(customerSubtotal * (1 + vatRate))
  const workshopTotal = round2(workshopSubtotal * (1 + vatRate))
  const vatAmount = round2(customerSubtotal * vatRate)

  return {
    customer_subtotal: round2(customerSubtotal),
    workshop_subtotal: round2(workshopSubtotal),
    labor_subtotal: round2(laborSubtotal),
    vat_amount: vatAmount,
    customer_total: customerTotal,
    workshop_total: workshopTotal,
    net_profit: round2(customerTotal - workshopTotal)
  }
}
