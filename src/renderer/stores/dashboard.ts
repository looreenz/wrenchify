import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardKPIs, DateRange, RevenueTrendPoint } from '../../shared/types'

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDefaultDateRange(): DateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: toISODate(start),
    end: toISODate(end)
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const kpis = ref<DashboardKPIs | null>(null)
  const trend = ref<RevenueTrendPoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const dateRange = ref<DateRange>(getDefaultDateRange())

  async function fetchKPIs(range?: DateRange): Promise<void> {
    const targetRange = range ?? dateRange.value
    loading.value = true
    error.value = null
    try {
      kpis.value = await window.wrenchifyAPI.dashboard.getKPIs(targetRange)
      dateRange.value = targetRange
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTrend(months = 12): Promise<void> {
    const now = new Date()
    const endDate = toISODate(now)
    loading.value = true
    error.value = null
    try {
      trend.value = await window.wrenchifyAPI.dashboard.getRevenueTrend(endDate)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    kpis,
    trend,
    loading,
    error,
    dateRange,
    fetchKPIs,
    fetchTrend
  }
})
