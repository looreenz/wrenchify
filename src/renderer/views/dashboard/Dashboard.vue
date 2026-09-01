<template>
  <div class="dashboard-view">
    <div class="page-header">
      <h1>{{ $t('dashboard.title') }}</h1>
      <n-date-picker
        v-model:value="dateRangeValue"
        type="range"
        clearable
        @update:value="handleDateRangeChange"
      />
    </div>

    <n-spin :show="dashboardStore.loading">
      <n-empty v-if="isEmpty" :description="$t('dashboard.empty')" class="dashboard-empty" />

      <template v-else>
        <div class="kpi-grid">
          <n-card class="kpi-card">
            <n-statistic :label="$t('dashboard.kpis.monthlyProfit')">
              <template #default>
                {{ formatCurrency(kpis?.profit.current ?? 0) }}
              </template>
              <template #suffix>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <span class="mom" :class="momClass(kpis?.profit.delta)">
                      {{ formatMoM(kpis?.profit) }}
                    </span>
                  </template>
                  <div class="mom-tooltip">
                    <div>{{ $t('dashboard.mom.current') }}: {{ formatCurrency(kpis?.profit.current ?? 0) }}</div>
                    <div>{{ $t('dashboard.mom.previous') }}: {{ formatPrevious(kpis?.profit) }}</div>
                    <div>{{ $t('dashboard.mom.change') }}: {{ formatChange(kpis?.profit) }}</div>
                  </div>
                </n-tooltip>
              </template>
            </n-statistic>
          </n-card>

          <n-card class="kpi-card">
            <n-statistic :label="$t('dashboard.kpis.monthlyRevenue')">
              <template #default>
                {{ formatCurrency(kpis?.revenue.current ?? 0) }}
              </template>
              <template #suffix>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <span class="mom" :class="momClass(kpis?.revenue.delta)">
                      {{ formatMoM(kpis?.revenue) }}
                    </span>
                  </template>
                  <div class="mom-tooltip">
                    <div>{{ $t('dashboard.mom.current') }}: {{ formatCurrency(kpis?.revenue.current ?? 0) }}</div>
                    <div>{{ $t('dashboard.mom.previous') }}: {{ formatPrevious(kpis?.revenue) }}</div>
                    <div>{{ $t('dashboard.mom.change') }}: {{ formatChange(kpis?.revenue) }}</div>
                  </div>
                </n-tooltip>
              </template>
            </n-statistic>
          </n-card>

          <n-card class="kpi-card">
            <n-statistic :label="$t('dashboard.kpis.pendingWorkOrders')">
              <template #default>
                {{ kpis?.pendingWorkOrders.count ?? 0 }}
              </template>
            </n-statistic>
          </n-card>

          <n-card class="kpi-card">
            <n-statistic :label="$t('dashboard.kpis.quoteConversionRate')">
              <template #default>
                {{ formatPercent(kpis?.conversionRate.current) }}
              </template>
              <template #suffix>
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <span class="mom" :class="momClass(kpis?.conversionRate.delta)">
                      {{ formatMoM(kpis?.conversionRate) }}
                    </span>
                  </template>
                  <div class="mom-tooltip">
                    <div>{{ $t('dashboard.mom.current') }}: {{ formatPercent(kpis?.conversionRate.current) }}</div>
                    <div>{{ $t('dashboard.mom.previous') }}: {{ formatPreviousPercent(kpis?.conversionRate) }}</div>
                    <div>{{ $t('dashboard.mom.change') }}: {{ formatChange(kpis?.conversionRate) }}</div>
                  </div>
                </n-tooltip>
              </template>
            </n-statistic>
          </n-card>
        </div>

        <n-card class="trend-card">
          <h2 class="trend-title">{{ $t('dashboard.trend.title') }}</h2>
          <div class="chart-container">
            <Bar
              v-if="chartData.labels.length > 0"
              :data="chartData"
              :options="chartOptions"
            />
          </div>
        </n-card>
      </template>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NDatePicker,
  NEmpty,
  NSpin,
  NStatistic,
  NTooltip
} from 'naive-ui'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'vue-chartjs'
import { useDashboardStore } from '../../stores/dashboard'
import { useSettingsStore } from '../../stores/settings'
import type { ConversionRateValue, DateRange, KPIValue } from '../../../shared/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const { t } = useI18n()
const dashboardStore = useDashboardStore()
const settingsStore = useSettingsStore()

const kpis = computed(() => dashboardStore.kpis)
const trend = computed(() => dashboardStore.trend)

const isEmpty = computed(() => {
  if (dashboardStore.loading) return false
  if (!kpis.value) return true
  return false
})

function toTimestamp(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime()
}

function fromTimestamp(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

const dateRangeValue = ref<[number, number]>([
  toTimestamp(dashboardStore.dateRange.start),
  toTimestamp(dashboardStore.dateRange.end)
])

watch(
  () => dashboardStore.dateRange,
  (range) => {
    dateRangeValue.value = [toTimestamp(range.start), toTimestamp(range.end)]
  },
  { immediate: true }
)

function handleDateRangeChange(value: [number, number] | null): void {
  if (!value || value.length !== 2) return
  const range: DateRange = {
    start: fromTimestamp(value[0]),
    end: fromTimestamp(value[1])
  }
  void dashboardStore.fetchKPIs(range)
}

function formatCurrency(value: number): string {
  const currency = settingsStore.settings.currency
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency
  }).format(value)
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value}%`
}

function formatMoM(value: KPIValue | ConversionRateValue | undefined): string {
  if (!value || value.previous === null) return 'N/A'
  const sign = (value.delta ?? 0) >= 0 ? '+' : ''
  const percent = value.deltaPercent !== null ? ` (${sign}${value.deltaPercent}%)` : ''
  return `${sign}${formatDeltaValue(value)}${percent}`
}

function formatDeltaValue(value: KPIValue | ConversionRateValue): string {
  if ('rate' in value) {
    return `${value.delta ?? 0}%`
  }
  return formatCurrency(value.delta ?? 0)
}

function formatPrevious(value: KPIValue | undefined): string {
  if (!value || value.previous === null) return 'N/A'
  return formatCurrency(value.previous)
}

function formatPreviousPercent(value: ConversionRateValue | undefined): string {
  if (!value || value.previous === null) return 'N/A'
  return `${value.previous}%`
}

function formatChange(value: KPIValue | ConversionRateValue | undefined): string {
  if (!value || value.delta === null) return 'N/A'
  const sign = value.delta >= 0 ? '+' : ''
  if ('rate' in value) {
    return `${sign}${value.delta}%`
  }
  return `${sign}${formatCurrency(value.delta)}`
}

function momClass(delta: number | null): string {
  if (delta === null) return ''
  return delta >= 0 ? 'positive' : 'negative'
}

function localizeMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const monthNames = t('dashboard.trend.months') as unknown as string[]
  const monthName = monthNames[month - 1] ?? monthKey
  return `${monthName} ${year}`
}

const chartData = computed(() => ({
  labels: trend.value.map((point) => localizeMonth(point.month)),
  datasets: [
    {
      label: t('dashboard.trend.title'),
      data: trend.value.map((point) => point.revenue),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }
  ]
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: { parsed: { y: number } }) => formatCurrency(context.parsed.y)
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => formatCurrency(value)
      }
    }
  }
}))

onMounted(() => {
  void dashboardStore.fetchKPIs()
  void dashboardStore.fetchTrend()
  void settingsStore.load()
})
</script>

<style scoped>
.dashboard-view {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--bi-space-3);
  gap: var(--bi-space-2);
  flex-wrap: wrap;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--bi-on-surface);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--bi-space-2);
  margin-bottom: var(--bi-space-3);
}

.kpi-card :deep(.n-statistic__label) {
  color: var(--bi-on-surface-variant);
  font-size: 0.875rem;
}

.kpi-card :deep(.n-statistic__value) {
  color: var(--bi-on-surface);
  font-size: 1.75rem;
  font-weight: 600;
}

.mom {
  font-size: 0.875rem;
  font-weight: 500;
}

.mom.positive {
  color: var(--bi-success, #18a058);
}

.mom.negative {
  color: var(--bi-error, #d03050);
}

.mom-tooltip {
  font-size: 0.875rem;
  line-height: 1.5;
}

.trend-card {
  margin-top: var(--bi-space-3);
}

.trend-title {
  margin: 0 0 var(--bi-space-2);
  font-size: 1.125rem;
  color: var(--bi-on-surface);
}

.chart-container {
  position: relative;
  height: 320px;
}

.dashboard-empty {
  padding: var(--bi-space-4);
}
</style>
