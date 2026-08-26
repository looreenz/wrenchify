<template>
  <div class="quote-list">
    <div class="page-header">
      <h1>{{ $t('quote.title') }}</h1>
      <n-button type="primary" @click="handleCreate">
        {{ $t('app.new') }}
      </n-button>
    </div>

    <div class="filters">
      <n-input
        v-model:value="searchQuery"
        :placeholder="$t('customer.searchPlaceholder')"
        clearable
        class="search-input"
      />
      <n-select
        v-model:value="selectedCustomerId"
        :options="customerOptions"
        :placeholder="$t('quote.customer')"
        clearable
        class="customer-filter"
      />
      <n-select
        v-model:value="selectedStatus"
        :options="statusOptions"
        :placeholder="$t('quote.status')"
        clearable
        class="status-filter"
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredQuotes"
      :loading="quoteStore.loading"
      :row-key="(row) => row.id"
      striped
      class="quote-table"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDataTable,
  NInput,
  NSelect
} from 'naive-ui'
import { Pencil, Trash2, Eye } from 'lucide-vue-next'
import { useQuoteStore } from '../../stores/quotes'
import StatusLamp from '../../components/industrial/StatusLamp.vue'
import { useCustomerStore } from '../../stores/customers'
import { useVehicleStore } from '../../stores/vehicles'
import type { Quote, QuoteStatus } from '../../../shared/types'
import type { DataTableColumns } from 'naive-ui'

const router = useRouter()
const { t } = useI18n()
const quoteStore = useQuoteStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()

const searchQuery = ref('')
const selectedCustomerId = ref<number | null>(null)
const selectedStatus = ref<QuoteStatus | null>(null)

onMounted(() => {
  void quoteStore.load()
  void customerStore.load()
  void vehicleStore.load()
})

const customerMap = computed(() => {
  const map = new Map<number, string>()
  for (const c of customerStore.customers) {
    map.set(c.id, `${c.first_name ?? ''} ${c.last_name}`.trim())
  }
  return map
})

const vehicleMap = computed(() => {
  const map = new Map<number, string>()
  for (const v of vehicleStore.vehicles) {
    map.set(v.id, `${v.make ?? ''} ${v.model} · ${v.license_plate}`)
  }
  return map
})

const customerOptions = computed(() =>
  customerStore.customers.map((c) => ({
    label: `${c.first_name ?? ''} ${c.last_name}`.trim(),
    value: c.id
  }))
)

const statusOptions = computed(() => [
  { label: t('quote.statusDraft'), value: 'draft' as QuoteStatus },
  { label: t('quote.statusAccepted'), value: 'accepted' as QuoteStatus },
  { label: t('quote.statusRejected'), value: 'rejected' as QuoteStatus },
  { label: t('quote.statusConverted'), value: 'converted' as QuoteStatus }
])

const filteredQuotes = computed(() => {
  let result = quoteStore.quotes
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((q) => {
      const text = `${q.quote_number} ${q.description ?? ''}`.toLowerCase()
      return text.includes(query)
    })
  }
  if (selectedCustomerId.value !== null) {
    result = result.filter((q) => q.customer_id === selectedCustomerId.value)
  }
  if (selectedStatus.value !== null) {
    result = result.filter((q) => q.status === selectedStatus.value)
  }
  return result
})

function handleCreate(): void {
  void router.push({ name: 'QuoteCreate' })
}

function handleView(row: Quote): void {
  void router.push({ name: 'QuoteDetail', params: { id: String(row.id) } })
}

function handleEdit(row: Quote): void {
  void router.push({ name: 'QuoteEdit', params: { id: String(row.id) } })
}

async function handleDelete(row: Quote): Promise<void> {
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    await quoteStore.remove(row.id)
  } catch {
    window.alert(t('app.error'))
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function quoteStatusColor(status: QuoteStatus): string {
  switch (status) {
    case 'accepted':
      return 'var(--bi-success)'
    case 'rejected':
      return 'var(--bi-error)'
    case 'converted':
      return 'var(--bi-primary-container)'
    default:
      return 'var(--bi-tertiary-container)'
  }
}

function renderStatus(row: Quote) {
  const label = t(`quote.status${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`)
  return h(StatusLamp, {
    color: quoteStatusColor(row.status),
    size: 'sm',
    label
  })
}

function renderActions(row: Quote) {
  return h('div', { class: 'row-actions' }, [
    h(
      NButton,
      {
        size: 'small',
        quaternary: true,
        onClick: () => handleView(row)
      },
      { icon: () => h(Eye, { size: 16 }) }
    ),
    h(
      NButton,
      {
        size: 'small',
        quaternary: true,
        disabled: row.status !== 'draft',
        onClick: () => handleEdit(row)
      },
      { icon: () => h(Pencil, { size: 16 }) }
    ),
    h(
      NButton,
      {
        size: 'small',
        quaternary: true,
        type: 'error',
        disabled: row.status === 'converted',
        onClick: () => void handleDelete(row)
      },
      { icon: () => h(Trash2, { size: 16 }) }
    )
  ])
}

const columns = computed<DataTableColumns<Quote>>(() => [
  {
    title: t('quote.quoteNumber'),
    key: 'quote_number',
    sorter: (a, b) => a.quote_number.localeCompare(b.quote_number)
  },
  {
    title: t('quote.date'),
    key: 'date',
    render: (row) => new Date(row.date).toLocaleDateString()
  },
  {
    title: t('quote.customer'),
    key: 'customer_id',
    render: (row) => customerMap.value.get(row.customer_id) ?? ''
  },
  {
    title: t('quote.vehicle'),
    key: 'vehicle_id',
    render: (row) => vehicleMap.value.get(row.vehicle_id) ?? ''
  },
  {
    title: t('quote.totalCost'),
    key: 'total_cost',
    render: (row) => formatCurrency(row.total_cost),
    sorter: (a, b) => a.total_cost - b.total_cost
  },
  {
    title: t('quote.status'),
    key: 'status',
    render: renderStatus
  },
  {
    title: t('app.actions'),
    key: 'actions',
    render: renderActions
  }
])
</script>

<style scoped>
.quote-list {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--bi-space-2);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.filters {
  display: flex;
  gap: var(--bi-space-2);
  margin-bottom: var(--bi-space-2);
  flex-wrap: wrap;
}

.search-input {
  max-width: 320px;
  flex: 1;
}

.customer-filter,
.status-filter {
  max-width: 240px;
  flex: 1;
}

.quote-table {
  background-color: var(--bi-surface-container);
}

.row-actions {
  display: flex;
  gap: var(--bi-space-1);
}
</style>
