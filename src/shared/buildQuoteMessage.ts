import type { Quote, QuoteItem } from './types'

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

export interface QuoteMessageStrings {
  greeting: string
  intro: string
  workLabel: string
  partsHeader: string
  laborLabel: string
  laborUnitHours: string
  laborUnitRate: string
  totalLabel: string
  notesLabel: string
  closing: string
}

/**
 * Build a conversational plain-text quote message for sending to a customer.
 *
 * The caller resolves all labels in the customer's preferred language.
 * Parts are shown with VAT included in the line price.
 * Labor is shown separately (no VAT on labor).
 */
export function buildQuoteMessage(
  quote: Quote,
  items: QuoteItem[],
  vehicleLabel: string,
  strings: QuoteMessageStrings
): string {
  const vatRate = quote.vat_rate
  const lines: string[] = []

  // Conversational opening
  lines.push(strings.greeting)
  lines.push(strings.intro)

  // Work description
  if (quote.description) {
    lines.push('')
    lines.push(`${strings.workLabel}: ${quote.description}`)
  }

  // Parts with VAT-included price
  const partsItems = items.filter((i) => i.item_type !== 'labor')
  if (partsItems.length > 0) {
    lines.push('')
    lines.push(`${strings.partsHeader}:`)
    for (const item of partsItems) {
      const priceWithVat = round2(item.customer_price * (1 + vatRate))
      const lineTotal = round2(priceWithVat * item.quantity)
      const qty = item.quantity > 1 ? ` x${item.quantity}` : ''
      lines.push(`- ${item.description}${qty}: ${formatCurrency(lineTotal)}`)
    }
  }

  // Labor
  const laborItems = items.filter((i) => i.item_type === 'labor')
  const laborItemCost = laborItems.reduce(
    (sum, i) => sum + round2(i.quantity * quote.hourly_rate),
    0
  )
  const documentLaborCost = round2(quote.labor_hours * quote.hourly_rate)
  const totalLaborHours = round2(
    quote.labor_hours +
      laborItems.reduce((sum, i) => sum + i.quantity, 0)
  )
  const totalLaborCost = round2(documentLaborCost + laborItemCost)

  if (totalLaborHours > 0) {
    lines.push('')
    lines.push(
      `${strings.laborLabel}: ${totalLaborHours} ${strings.laborUnitHours} x ${formatCurrency(quote.hourly_rate)}/${strings.laborUnitRate} = ${formatCurrency(totalLaborCost)}`
    )
  }

  // Total
  lines.push('')
  lines.push(`${strings.totalLabel}: ${formatCurrency(quote.customer_total)}`)

  // Notes
  if (quote.notes) {
    lines.push('')
    lines.push(`${strings.notesLabel}: ${quote.notes}`)
  }

  // Closing
  lines.push('')
  lines.push(strings.closing)

  return lines.join('\n')
}
