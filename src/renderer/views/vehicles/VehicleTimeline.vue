<template>
  <div class="vehicle-timeline">
    <div class="page-header">
      <div>
        <h1>{{ $t('vehicle.timeline') }}</h1>
        <p v-if="vehicle" class="vehicle-subtitle">
          {{ vehicle.make }} {{ vehicle.model }} · {{ vehicle.license_plate }}
        </p>
      </div>
      <n-button @click="handleBack">
        {{ $t('app.back') }}
      </n-button>
    </div>

    <div class="filters">
      <n-date-picker
        v-model:formatted-value="dateFrom"
        type="date"
        clearable
        :placeholder="$t('workOrder.filterDateFrom')"
        value-format="yyyy-MM-dd"
        class="date-filter"
      />
      <n-date-picker
        v-model:formatted-value="dateTo"
        type="date"
        clearable
        :placeholder="$t('workOrder.filterDateTo')"
        value-format="yyyy-MM-dd"
        class="date-filter"
      />
      <n-select
        v-model:value="selectedPaymentStatus"
        :options="paymentStatusOptions"
        :placeholder="$t('workOrder.filterPaymentStatus')"
        clearable
        class="status-filter"
      />
    </div>

    <n-spin :show="loading">
      <n-empty v-if="filteredEntries.length === 0" :description="$t('app.noResults')" />
      <div v-else class="timeline">
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="timeline-entry"
        >
          <div class="entry-date">
            <span class="date-label">{{ formatDate(entry.date_in) }}</span>
            <n-tag :type="statusType(entry.payment_status)">
              {{ $t(`workOrder.payment${capitalize(entry.payment_status)}`) }}
            </n-tag>
          </div>
          <div class="entry-body">
            <p class="entry-number">#{{ entry.order_number }}</p>
            <p v-if="entry.description" class="entry-description">
              {{ entry.description }}
            </p>
            <div class="entry-meta">
              <span v-if="entry.date_out">
                {{ $t('workOrder.dateOut') }}: {{ formatDate(entry.date_out) }}
              </span>
              <span v-if="entry.mileage_in !== null">
                {{ $t('workOrder.mileageIn') }}: {{ entry.mileage_in }}
              </span>
              <span v-if="entry.mileage_out !== null">
                {{ $t('workOrder.mileageOut') }}: {{ entry.mileage_out }}
              </span>
            </div>
          </div>
          <div class="entry-cost">
            {{ formatCurrency(entry.total_cost) }}
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDatePicker,
  NEmpty,
  NSelect,
  NSpin,
  NTag
} from 'naive-ui'
import { useVehicleStore } from '../../stores/vehicles'
import type { Vehicle, VehicleTimelineEntry, WorkOrderPaymentStatus } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const vehicleStore = useVehicleStore()

const loading = ref(false)
const vehicle = ref<Vehicle | undefined>(undefined)
const entries = ref<VehicleTimelineEntry[]>([])
const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const selectedPaymentStatus = ref<WorkOrderPaymentStatus | null>(null)

const vehicleId = computed(() => Number(route.params.id))

const paymentStatusOptions = computed(() => [
  { label: t('workOrder.paymentPending'), value: 'pending' },
  { label: t('workOrder.paymentPartial'), value: 'partial' },
  { label: t('workOrder.paymentPaid'), value: 'paid' }
])

const filteredEntries = computed(() => {
  let result = [...entries.value].sort(
    (a, b) => new Date(b.date_in).getTime() - new Date(a.date_in).getTime()
  )
  if (dateFrom.value) {
    const from = new Date(dateFrom.value).getTime()
    result = result.filter((e) => new Date(e.date_in).getTime() >= from)
  }
  if (dateTo.value) {
    const to = new Date(dateTo.value).getTime()
    result = result.filter((e) => new Date(e.date_in).getTime() <= to)
  }
  if (selectedPaymentStatus.value) {
    result = result.filter((e) => e.payment_status === selectedPaymentStatus.value)
  }
  return result
})

onMounted(async () => {
  loading.value = true
  try {
    ;[vehicle.value, entries.value] = await Promise.all([
      vehicleStore.getById(vehicleId.value),
      vehicleStore.getTimeline(vehicleId.value)
    ])
  } finally {
    loading.value = false
  }
})

function handleBack(): void {
  void router.push({ name: 'VehicleList' })
}

function formatDate(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function capitalize(value: WorkOrderPaymentStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function statusType(status: WorkOrderPaymentStatus): 'default' | 'warning' | 'success' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'partial':
      return 'warning'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.vehicle-timeline {
  max-width: 1000px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--bi-space-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.vehicle-subtitle {
  margin: 4px 0 0;
  color: var(--bi-on-surface-variant);
}

.filters {
  display: flex;
  gap: var(--bi-space-2);
  margin-bottom: var(--bi-space-3);
  flex-wrap: wrap;
}

.date-filter,
.status-filter {
  min-width: 200px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--bi-space-2);
}

.timeline-entry {
  display: flex;
  gap: var(--bi-space-2);
  background-color: var(--bi-surface-container);
  padding: var(--bi-space-2);
  border-radius: var(--bi-radius-lg);
  border-left: 4px solid var(--bi-success);
}

.entry-date {
  display: flex;
  flex-direction: column;
  gap: var(--bi-space-1);
  min-width: 120px;
}

.date-label {
  font-weight: 600;
}

.entry-body {
  flex: 1;
}

.entry-number {
  margin: 0 0 var(--bi-space-1);
  font-weight: 600;
  color: var(--bi-text);
}

.entry-description {
  margin: 0 0 var(--bi-space-1);
  color: var(--bi-on-surface-variant);
}

.entry-meta {
  display: flex;
  gap: var(--bi-space-2);
  font-size: 0.875rem;
  color: var(--bi-on-surface-variant);
}

.entry-cost {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--bi-success);
  white-space: nowrap;
}
</style>
