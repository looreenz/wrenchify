<template>
  <div class="quote-detail">
    <div class="page-header">
      <h1>{{ $t('quote.detail') }}</h1>
      <n-button @click="handleBack">
        {{ $t('app.back') }}
      </n-button>
    </div>

    <n-spin :show="loading">
      <n-card v-if="quote">
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.quoteNumber') }}</span>
          <span class="detail-value">{{ quote.quote_number }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.date') }}</span>
          <span class="detail-value">{{ formatDate(quote.date) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.status') }}</span>
          <n-tag :type="statusType(quote.status)">
            {{ $t(`quote.status${capitalize(quote.status)}`) }}
          </n-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.customer') }}</span>
          <span class="detail-value">{{ customerName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.vehicle') }}</span>
          <span class="detail-value">{{ vehicleName }}</span>
        </div>
        <div v-if="quote.description" class="detail-row">
          <span class="detail-label">{{ $t('quote.description') }}</span>
          <span class="detail-value">{{ quote.description }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.laborHours') }}</span>
          <span class="detail-value">{{ quote.labor_hours }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.hourlyRate') }}</span>
          <span class="detail-value">{{ formatCurrency(quote.hourly_rate) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.partsCost') }}</span>
          <span class="detail-value">{{ formatCurrency(quote.parts_cost) }}</span>
        </div>
        <div class="detail-row total-row">
          <span class="detail-label">{{ $t('quote.totalCost') }}</span>
          <span class="detail-value">{{ formatCurrency(quote.total_cost) }}</span>
        </div>
        <div v-if="quote.notes" class="detail-row">
          <span class="detail-label">{{ $t('quote.notes') }}</span>
          <span class="detail-value">{{ quote.notes }}</span>
        </div>

        <div class="detail-actions">
          <n-button v-if="quote.status === 'draft'" type="success" @click="handleAccept">
            {{ $t('quote.statusAccepted') }}
          </n-button>
          <n-button v-if="quote.status === 'draft'" type="error" @click="handleReject">
            {{ $t('quote.statusRejected') }}
          </n-button>
          <n-button v-if="quote.status === 'accepted'" type="primary" @click="handleConvert">
            {{ $t('quote.convert') }}
          </n-button>
          <n-button v-if="quote.status === 'draft'" @click="handleEdit">
            {{ $t('app.edit') }}
          </n-button>
        </div>
      </n-card>

      <n-empty v-else :description="$t('app.noResults')" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCard,
  NEmpty,
  NSpin,
  NTag
} from 'naive-ui'
import { useQuoteStore } from '../../stores/quotes'
import { useCustomerStore } from '../../stores/customers'
import { useVehicleStore } from '../../stores/vehicles'
import type { Quote, QuoteStatus } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const quoteStore = useQuoteStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()

const loading = ref(false)
const quote = ref<Quote | undefined>(undefined)

const quoteId = computed(() => Number(route.params.id))

const customerName = computed(() => {
  const customer = customerStore.customers.find((c) => c.id === quote.value?.customer_id)
  if (!customer) return ''
  return `${customer.first_name ?? ''} ${customer.last_name}`.trim()
})

const vehicleName = computed(() => {
  const vehicle = vehicleStore.vehicles.find((v) => v.id === quote.value?.vehicle_id)
  if (!vehicle) return ''
  return `${vehicle.make ?? ''} ${vehicle.model} · ${vehicle.license_plate}`
})

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      loadQuote(),
      customerStore.load(),
      vehicleStore.load()
    ])
  } finally {
    loading.value = false
  }
})

async function loadQuote(): Promise<void> {
  quote.value = await quoteStore.getById(quoteId.value)
}

function handleBack(): void {
  void router.push({ name: 'QuoteList' })
}

function handleEdit(): void {
  void router.push({ name: 'QuoteEdit', params: { id: String(quoteId.value) } })
}

async function handleAccept(): Promise<void> {
  await updateStatus('accepted')
}

async function handleReject(): Promise<void> {
  await updateStatus('rejected')
}

async function updateStatus(status: QuoteStatus): Promise<void> {
  if (!quote.value) return
  try {
    await quoteStore.update(quote.value.id, { status })
    await loadQuote()
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleConvert(): Promise<void> {
  if (!quote.value) return
  try {
    const workOrder = await quoteStore.convert(quote.value.id)
    void router.push({ name: 'WorkOrderEdit', params: { id: String(workOrder.id) } })
  } catch {
    window.alert(t('app.error'))
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function capitalize(value: QuoteStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function statusType(status: QuoteStatus): 'default' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'accepted':
    case 'converted':
      return 'success'
    case 'rejected':
      return 'error'
    default:
      return 'default'
  }
}
</script>

<style scoped>
.quote-detail {
  max-width: 800px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  font-weight: 500;
  color: #666;
}

.detail-value {
  font-weight: 400;
  text-align: right;
  max-width: 60%;
}

.total-row {
  font-size: 1.1rem;
  color: #18a058;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style>
