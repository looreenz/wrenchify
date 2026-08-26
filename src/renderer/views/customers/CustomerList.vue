<template>
  <div class="customer-list">
    <div class="page-header">
      <h1>{{ $t('customer.title') }}</h1>
      <n-button type="primary" @click="handleCreate">
        {{ $t('app.new') }}
      </n-button>
    </div>

    <n-input
      v-model:value="searchQuery"
      :placeholder="$t('customer.searchPlaceholder')"
      clearable
      class="search-input"
      @update:value="handleSearch"
    />

    <n-data-table
      :columns="columns"
      :data="filteredCustomers"
      :loading="customerStore.loading"
      :row-key="(row) => row.id"
      striped
      class="customer-table"
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
  NInput
} from 'naive-ui'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useCustomerStore } from '../../stores/customers'
import type { CustomerWithVehicleCount } from '../../../shared/types'
import type { DataTableColumns } from 'naive-ui'

const router = useRouter()
const { t } = useI18n()
const customerStore = useCustomerStore()

const searchQuery = ref('')

onMounted(() => {
  void customerStore.load()
})

const filteredCustomers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return customerStore.customers
  return customerStore.customers.filter((c) => {
    const fullName = `${c.first_name ?? ''} ${c.last_name}`.toLowerCase()
    return fullName.includes(query)
  })
})

function handleSearch(): void {
  // Client-side filtering is performed by computed property.
  // This handler is kept for future debounced server-side search.
}

function handleCreate(): void {
  void router.push({ name: 'CustomerCreate' })
}

function handleEdit(row: CustomerWithVehicleCount): void {
  void router.push({ name: 'CustomerEdit', params: { id: String(row.id) } })
}

async function handleDelete(row: CustomerWithVehicleCount): Promise<void> {
  const confirmed = window.confirm(
    t('customer.messages.deleteConfirm', { count: row.vehicle_count })
  )
  if (!confirmed) return
  try {
    await customerStore.remove(row.id)
  } catch {
    window.alert(t('app.error'))
  }
}

function renderActions(row: CustomerWithVehicleCount) {
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

const columns = computed<DataTableColumns<CustomerWithVehicleCount>>(() => [
  {
    title: t('customer.firstName'),
    key: 'first_name',
    sorter: (a, b) => (a.first_name ?? '').localeCompare(b.first_name ?? '')
  },
  {
    title: t('customer.lastName'),
    key: 'last_name',
    sorter: (a, b) => a.last_name.localeCompare(b.last_name)
  },
  {
    title: t('customer.phone'),
    key: 'phone'
  },
  {
    title: t('customer.email'),
    key: 'email'
  },
  {
    title: t('customer.vehicleCount'),
    key: 'vehicle_count',
    sorter: (a, b) => a.vehicle_count - b.vehicle_count
  },
  {
    title: t('app.actions'),
    key: 'actions',
    render: renderActions
  }
])
</script>

<style scoped>
.customer-list {
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

.search-input {
  max-width: 400px;
  margin-bottom: var(--bi-space-2);
}

.customer-table {
  background-color: var(--bi-surface-container);
}

.row-actions {
  display: flex;
  gap: var(--bi-space-1);
}
</style>
