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

        <div class="items-section">
          <h3>{{ $t('quote.items') }}</h3>
          <n-empty v-if="lineItems.length === 0" :description="$t('app.empty')" />
          <div v-else class="items-table">
            <div class="items-header">
              <span class="col-description">{{ $t('lineItem.description') }}</span>
              <span class="col-type">{{ $t('lineItem.type') }}</span>
              <span class="col-qty">{{ $t('lineItem.quantity') }}</span>
              <span class="col-price">{{ $t('lineItem.customerPrice') }}</span>
              <span class="col-total">{{ $t('lineItem.total') }}</span>
            </div>
            <div v-for="item in lineItems" :key="item.id" class="items-row">
              <span class="col-description">{{ item.description }}</span>
              <span class="col-type">{{ $t(`lineItem.type${capitalize(item.item_type)}`) }}</span>
              <span class="col-qty">{{ item.quantity }}</span>
              <span class="col-price">{{ formatCurrency(item.customer_price) }}</span>
              <span class="col-total">{{ formatCurrency(rowCustomerTotal(item)) }}</span>
            </div>
          </div>
        </div>

        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.vatAmount') }}</span>
          <span class="detail-value">{{ formatCurrency(vatAmount) }}</span>
        </div>
        <div class="detail-row total-row">
          <span class="detail-label">{{ $t('quote.customerTotal') }}</span>
          <span class="detail-value">{{ formatCurrency(quote.customer_total) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{{ $t('quote.workshopTotal') }}</span>
          <span class="detail-value">{{ formatCurrency(quote.workshop_total) }}</span>
        </div>
        <div class="detail-row profit-row">
          <span class="detail-label">{{ $t('quote.netProfit') }}</span>
          <span class="detail-value">{{ formatCurrency(netProfit) }}</span>
        </div>
        <div v-if="quote.notes" class="detail-row">
          <span class="detail-label">{{ $t('quote.notes') }}</span>
          <span class="detail-value">{{ quote.notes }}</span>
        </div>

        <div class="detail-actions">
          <n-button v-if="quote.status === 'draft'" type="success" data-testid="quote-accept" @click="handleAccept">
            {{ $t('quote.statusAccepted') }}
          </n-button>
          <n-button v-if="quote.status === 'draft'" type="error" @click="handleReject">
            {{ $t('quote.statusRejected') }}
          </n-button>
          <n-button v-if="quote.status === 'accepted'" type="primary" data-testid="quote-convert" @click="handleConvert">
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
import { useSettingsStore } from '../../stores/settings'
import type { Quote, QuoteItem, QuoteStatus, WorkOrderItemType } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const quoteStore = useQuoteStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()
const settingsStore = useSettingsStore()

const loading = ref(false)
const quote = ref<Quote | undefined>(undefined)
const lineItems = ref<QuoteItem[]>([])

const quoteId = computed(() => Number(route.params.id))
const vatRate = computed(() => quote.value?.vat_rate ?? settingsStore.vatRate)

const vatAmount = computed(() => {
  if (!quote.value) return 0
  return Math.round((quote.value.customer_total - (quote.value.customer_total / (1 + vatRate.value))) * 100) / 100
})

const netProfit = computed(() => {
  if (!quote.value) return 0
  return Math.round((quote.value.customer_total - quote.value.workshop_total) * 100) / 100
})

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
      vehicleStore.load(),
      settingsStore.load()
    ])
  } finally {
    loading.value = false
  }
})

async function loadQuote(): Promise<void> {
  quote.value = await quoteStore.getById(quoteId.value)
  if (quote.value) {
    lineItems.value = await quoteStore.getLineItems(quote.value.id)
  }
}

function rowCustomerTotal(item: QuoteItem): number {
  if (item.item_type === 'labor') {
    return Math.round(item.quantity * (quote.value?.hourly_rate ?? 0) * (1 + vatRate.value) * 100) / 100
  }
  return Math.round(item.quantity * item.customer_price * (1 + vatRate.value) * 100) / 100
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

function capitalize(value: QuoteStatus | WorkOrderItemType): string {
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
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--bi-space-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--bi-outline);
}

.detail-label {
  font-weight: 500;
  color: var(--bi-on-surface-variant);
}

.detail-value {
  font-weight: 400;
  text-align: right;
  max-width: 60%;
}

.items-section {
  margin: var(--bi-space-3) 0;
}

.items-section h3 {
  margin: 0 0 var(--bi-space-2);
  font-size: 1rem;
  color: var(--bi-on-surface);
}

.items-table {
  display: flex;
  flex-direction: column;
  gap: var(--bi-space-1);
}

.items-header,
.items-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: var(--bi-space-2);
  padding: var(--bi-space-2);
  border-radius: var(--bi-radius-md);
}

.items-header {
  background-color: var(--bi-surface-container-high);
  font-weight: 600;
  color: var(--bi-on-surface-variant);
}

.items-row {
  background-color: var(--bi-surface-container);
}

.col-description {
  text-align: left;
}

.col-type,
.col-qty,
.col-price,
.col-total {
  text-align: right;
}

.total-row {
  font-size: 1.1rem;
  color: var(--bi-success);
  font-weight: 600;
}

.profit-row {
  color: var(--bi-success);
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: var(--bi-space-2);
  margin-top: var(--bi-space-3);
}
</style>
