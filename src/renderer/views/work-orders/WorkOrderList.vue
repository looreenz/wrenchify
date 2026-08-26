<template>
  <div class="work-order-list">
    <div class="page-header">
      <h1>{{ $t('workOrder.title') }}</h1>
      <n-button type="primary" @click="handleCreate">
        {{ $t('app.new') }}
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
      <n-select
        v-model:value="selectedCustomerId"
        :options="customerOptions"
        :placeholder="$t('workOrder.customer')"
        clearable
        class="customer-filter"
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredWorkOrders"
      :loading="workOrderStore.loading"
      :row-key="(row) => row.id"
      striped
      class="work-order-table"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDataTable,
  NDatePicker,
  NSelect,
  NTag
} from 'naive-ui'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useWorkOrderStore } from '../../stores/workOrders'
import { useCustomerStore } from '../../stores/customers'
import { useVehicleStore } from '../../stores/vehicles'
import type { WorkOrder, WorkOrderPaymentStatus } from '../../../shared/types'
import type { DataTableColumns } from 'naive-ui'

const router = useRouter()
const { t } = useI18n()
const workOrderStore = useWorkOrderStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()

const dateFrom = ref<string | null>(null)
const dateTo = ref<string | null>(null)
const selectedPaymentStatus = ref<WorkOrderPaymentStatus | null>(null)
const selectedCustomerId = ref<number | null>(null)

onMounted(() => {
  void workOrderStore.load()
  void customerStore.load()
  void vehicleStore.load()
})

watch([dateFrom, dateTo, selectedPaymentStatus, selectedCustomerId], () => {
  const filter = {
    date_from: dateFrom.value ?? undefined,
    date_to: dateTo.value ?? undefined,
    payment_status: selectedPaymentStatus.value ?? undefined,
    customer_id: selectedCustomerId.value ?? undefined
  }
  void workOrderStore.load(filter)
}, { immediate: false })

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

const paymentStatusOptions = computed(() => [
  { label: t('workOrder.paymentPending'), value: 'pending' as WorkOrderPaymentStatus },
  { label: t('workOrder.paymentPartial'), value: 'partial' as WorkOrderPaymentStatus },
  { label: t('workOrder.paymentPaid'), value: 'paid' as WorkOrderPaymentStatus }
])

const filteredWorkOrders = computed(() => workOrderStore.workOrders)

function handleCreate(): void {
  void router.push({ name: 'WorkOrderCreate' })
}

function handleEdit(row: WorkOrder): void {
  void router.push({ name: 'WorkOrderEdit', params: { id: String(row.id) } })
}

async function handleDelete(row: WorkOrder): Promise<void> {
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    await workOrderStore.remove(row.id)
  } catch {
    window.alert(t('app.error'))
  }
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function renderStatus(row: WorkOrder) {
  return h(
    NTag,
    { type: statusType(row.payment_status), size: 'small' },
    { default: () => t(`workOrder.payment${capitalize(row.payment_status)}`) }
  )
}

function capitalize(value: WorkOrderPaymentStatus): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function renderActions(row: WorkOrder) {
  return h('div', { class: 'row-actions' }, [
    h(
      NButton,
      {
        size: 'small',
        quaternary: true,
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
        onClick: () => void handleDelete(row)
      },
      { icon: () => h(Trash2, { size: 16 }) }
    )
  ])
}

const columns = computed<DataTableColumns<WorkOrder>>(() => [
  {
    title: t('workOrder.orderNumber'),
    key: 'order_number',
    sorter: (a, b) => a.order_number.localeCompare(b.order_number)
  },
  {
    title: t('workOrder.dateIn'),
    key: 'date_in',
    render: (row) => new Date(row.date_in).toLocaleDateString()
  },
  {
    title: t('workOrder.customer'),
    key: 'customer_id',
    render: (row) => customerMap.value.get(row.customer_id) ?? ''
  },
  {
    title: t('workOrder.vehicle'),
    key: 'vehicle_id',
    render: (row) => vehicleMap.value.get(row.vehicle_id) ?? ''
  },
  {
    title: t('workOrder.totalCost'),
    key: 'total_cost',
    render: (row) => formatCurrency(row.total_cost),
    sorter: (a, b) => a.total_cost - b.total_cost
  },
  {
    title: t('workOrder.paymentStatus'),
    key: 'payment_status',
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
.work-order-list {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.date-filter,
.status-filter,
.customer-filter {
  min-width: 200px;
  flex: 1;
}

.work-order-table {
  background-color: #fff;
}

.row-actions {
  display: flex;
  gap: 8px;
}
</style>
