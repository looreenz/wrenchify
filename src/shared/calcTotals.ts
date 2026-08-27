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
 * - VAT is applied ONLY to parts (not to labor).
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

  // VAT only on parts, not on labor
  const customerTotal = round2(partsCustomerSubtotal * (1 + vatRate)) + laborSubtotal
  const workshopTotal = round2(partsWorkshopSubtotal * (1 + vatRate))
  const partsTotal = round2(partsCustomerSubtotal * (1 + vatRate))
  const vatAmount = round2(partsCustomerSubtotal * vatRate)

  return {
    customer_subtotal: round2(partsCustomerSubtotal),
    workshop_subtotal: round2(partsWorkshopSubtotal),
    labor_subtotal: round2(laborSubtotal),
    vat_amount: vatAmount,
    customer_total: round2(customerTotal),
    workshop_total: round2(workshopTotal),
    parts_total: round2(partsTotal),
    net_profit: round2(laborSubtotal + partsTotal - workshopTotal)
  }
}
