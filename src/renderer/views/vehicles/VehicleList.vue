<template>
  <div class="vehicle-list">
    <div class="page-header">
      <h1>{{ $t('vehicle.title') }}</h1>
      <n-button type="primary" @click="handleCreate">
        {{ $t('app.new') }}
      </n-button>
    </div>

    <div class="filters">
      <n-input
        v-model:value="searchQuery"
        :placeholder="$t('vehicle.searchPlaceholder')"
        clearable
        class="search-input"
      />
      <n-select
        v-model:value="selectedCustomerId"
        :options="customerOptions"
        :placeholder="$t('vehicle.filterByCustomer')"
        clearable
        class="customer-filter"
      />
    </div>

    <n-data-table
      :columns="columns"
      :data="filteredVehicles"
      :loading="vehicleStore.loading"
      :row-key="(row) => row.id"
      striped
      class="vehicle-table"
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
import { Pencil, Trash2, Clock } from 'lucide-vue-next'
import { useVehicleStore } from '../../stores/vehicles'
import { useCustomerStore } from '../../stores/customers'
import type { Vehicle } from '../../../shared/types'
import type { DataTableColumns } from 'naive-ui'

const router = useRouter()
const { t } = useI18n()
const vehicleStore = useVehicleStore()
const customerStore = useCustomerStore()

const searchQuery = ref('')
const selectedCustomerId = ref<number | null>(null)

onMounted(() => {
  void vehicleStore.load()
  void customerStore.load()
})

const customerMap = computed(() => {
  const map = new Map<number, string>()
  for (const c of customerStore.customers) {
    const name = `${c.first_name ?? ''} ${c.last_name}`.trim()
    map.set(c.id, name)
  }
  return map
})

const customerOptions = computed(() => [
  { label: t('vehicle.allCustomers'), value: null },
  ...customerStore.customers.map((c) => ({
    label: `${c.first_name ?? ''} ${c.last_name}`.trim(),
    value: c.id
  }))
])

const filteredVehicles = computed(() => {
  let result = vehicleStore.vehicles
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((v) => {
      const searchText = `${v.license_plate} ${v.make ?? ''} ${v.model}`.toLowerCase()
      return searchText.includes(query)
    })
  }
  if (selectedCustomerId.value !== null) {
    result = result.filter((v) => v.customer_id === selectedCustomerId.value)
  }
  return result
})

function handleCreate(): void {
  if (selectedCustomerId.value !== null) {
    void router.push({
      name: 'VehicleCreate',
      query: { customerId: String(selectedCustomerId.value) }
    })
  } else {
    void router.push({ name: 'VehicleCreate' })
  }
}

function handleEdit(row: Vehicle): void {
  void router.push({ name: 'VehicleEdit', params: { id: String(row.id) } })
}

function handleTimeline(row: Vehicle): void {
  void router.push({ name: 'VehicleTimeline', params: { id: String(row.id) } })
}

async function handleDelete(row: Vehicle): Promise<void> {
  const confirmed = window.confirm(t('vehicle.messages.deleteConfirm'))
  if (!confirmed) return
  try {
    await vehicleStore.remove(row.id)
  } catch {
    window.alert(t('app.error'))
  }
}

function renderActions(row: Vehicle) {
  return h('div', { class: 'row-actions' }, [
    h(
      NButton,
      {
        size: 'small',
        quaternary: true,
        onClick: () => handleTimeline(row)
      },
      { icon: () => h(Clock, { size: 16 }) }
    ),
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

  const columns = computed<DataTableColumns<Vehicle>>(() => [
  {
    title: t('vehicle.licensePlate'),
    key: 'license_plate',
    sorter: (a, b) => a.license_plate.localeCompare(b.license_plate),
    render: (row) => h('span', { class: 'mono-text' }, row.license_plate)
  },
  {
    title: t('vehicle.make'),
    key: 'make',
    sorter: (a, b) => (a.make ?? '').localeCompare(b.make ?? '')
  },
  {
    title: t('vehicle.model'),
    key: 'model',
    sorter: (a, b) => a.model.localeCompare(b.model)
  },
  {
    title: t('vehicle.year'),
    key: 'year',
    sorter: (a, b) => (a.year ?? 0) - (b.year ?? 0)
  },
  {
    title: t('vehicle.customer'),
    key: 'customer_id',
    render: (row) => customerMap.value.get(row.customer_id) ?? ''
  },
  {
    title: t('app.actions'),
    key: 'actions',
    render: renderActions
  }
])
</script>

<style scoped>
.vehicle-list {
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
}

.search-input {
  max-width: 320px;
  flex: 1;
}

.customer-filter {
  max-width: 280px;
  flex: 1;
}

.vehicle-table {
  background-color: var(--bi-surface-container);
}

.mono-text {
  font: var(--bi-data-mono);
}

.row-actions {
  display: flex;
  gap: var(--bi-space-1);
}
</style>
