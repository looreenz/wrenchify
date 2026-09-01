import type {
  DashboardKPIs,
  DateRange,
  KPIValue,
  ConversionRateValue,
  RevenueTrendPoint
} from '../../shared/types'
import { getDatabase } from '../connection'

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getPreviousPeriod(start: string, end: string): DateRange {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const previousEnd = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
  const previousStart = new Date(previousEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000)

  return {
    start: toISODate(previousStart),
    end: toISODate(previousEnd)
  }
}

function buildKPIValue(current: number, previous: number | null): KPIValue {
  const delta = previous === null ? null : current - previous
  const deltaPercent =
    previous === null || previous === 0 ? null : Number((((current - previous) / previous) * 100).toFixed(2))

  return {
    current,
    previous,
    delta,
    deltaPercent
  }
}

function buildConversionRateValue(current: number | null, previous: number | null): ConversionRateValue {
  const delta = current === null || previous === null ? null : current - previous
  const deltaPercent =
    current === null || previous === null || previous === 0
      ? null
      : Number((((current - previous) / previous) * 100).toFixed(2))

  return {
    current,
    previous,
    delta,
    deltaPercent
  }
}

function getProfitAndRevenue(start: string, end: string): { profit: number; revenue: number; count: number } {
  const db = getDatabase()
  const row = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(customer_total), 0) AS revenue,
        COALESCE(SUM(customer_total) - SUM(workshop_total), 0) AS profit,
        COUNT(*) AS count
      FROM work_orders
      WHERE date_in >= ? AND date_in <= ?
    `
    )
    .get(start, end) as { revenue: number; profit: number; count: number }

  return {
    profit: Number(row.profit),
    revenue: Number(row.revenue),
    count: Number(row.count)
  }
}

function getConversionRate(start: string, end: string): { rate: number | null; total: number } {
  const db = getDatabase()
  const row = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status IN ('accepted', 'converted') THEN 1 ELSE 0 END) AS converted
      FROM quotes
      WHERE date >= ? AND date <= ?
    `
    )
    .get(start, end) as { total: number; converted: number }

  const total = Number(row.total)
  const converted = Number(row.converted)

  return {
    total,
    rate: total > 0 ? Math.round((converted / total) * 100) : null
  }
}

export function getKPIs(start: string, end: string): DashboardKPIs {
  const db = getDatabase()
  const previousPeriod = getPreviousPeriod(start, end)

  const currentProfitRevenue = getProfitAndRevenue(start, end)
  const previousProfitRevenue = getProfitAndRevenue(previousPeriod.start, previousPeriod.end)

  const currentConversion = getConversionRate(start, end)
  const previousConversion = getConversionRate(previousPeriod.start, previousPeriod.end)

  const pendingRow = db
    .prepare("SELECT COUNT(*) AS count FROM work_orders WHERE payment_status = 'pending'")
    .get() as { count: number }

  return {
    profit: buildKPIValue(
      currentProfitRevenue.profit,
      previousProfitRevenue.count > 0 ? previousProfitRevenue.profit : null
    ),
    revenue: buildKPIValue(
      currentProfitRevenue.revenue,
      previousProfitRevenue.count > 0 ? previousProfitRevenue.revenue : null
    ),
    pendingWorkOrders: { count: Number(pendingRow.count) },
    conversionRate: buildConversionRateValue(
      currentConversion.rate,
      previousConversion.total > 0 ? previousConversion.rate : null
    )
  }
}

export function getRevenueTrend(endDate: string): RevenueTrendPoint[] {
  const db = getDatabase()

  const end = new Date(`${endDate}T00:00:00`)
  const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)

  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`
  const endMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`

  const rows = db
    .prepare(
      `
      SELECT
        strftime('%Y-%m', date_in) AS month,
        COALESCE(SUM(customer_total), 0) AS revenue
      FROM work_orders
      WHERE date_in >= ? AND date_in <= ?
      GROUP BY strftime('%Y-%m', date_in)
      ORDER BY month
    `
    )
    .all(`${startMonth}-01`, endDate) as { month: string; revenue: number }[]

  const revenueByMonth = new Map<string, number>()
  for (const row of rows) {
    revenueByMonth.set(row.month, Number(row.revenue))
  }

  const points: RevenueTrendPoint[] = []
  let year = start.getFullYear()
  let month = start.getMonth() + 1
  const endYear = end.getFullYear()
  const endMonthNumber = end.getMonth() + 1

  while (year < endYear || (year === endYear && month <= endMonthNumber)) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    points.push({
      month: monthKey,
      label: monthKey,
      revenue: revenueByMonth.get(monthKey) ?? 0
    })

    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  return points
}
