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

    <div class="vehicle-grid">
      <IndustrialCard
        v-for="vehicle in filteredVehicles"
        :key="vehicle.id"
        class="vehicle-card"
      >
        <template #title>
          <span class="mono-text">{{ vehicle.license_plate }}</span>
        </template>
        <template #header-actions>
          <div class="row-actions">
            <n-button
              size="small"
              quaternary
              :title="$t('vehicle.timeline')"
              @click="handleTimeline(vehicle)"
            >
              <template #icon>
                <Clock :size="16" />
              </template>
            </n-button>
            <n-button
              size="small"
              quaternary
              :title="$t('app.edit')"
              @click="handleEdit(vehicle)"
            >
              <template #icon>
                <Pencil :size="16" />
              </template>
            </n-button>
            <n-button
              size="small"
              quaternary
              type="error"
              :title="$t('app.delete')"
              @click="void handleDelete(vehicle)"
            >
              <template #icon>
                <Trash2 :size="16" />
              </template>
            </n-button>
          </div>
        </template>

        <div class="vehicle-fields">
          <div class="vehicle-field">
            <span class="field-label">{{ $t('vehicle.make') }}</span>
            <span class="field-value">{{ vehicle.make ?? '-' }}</span>
          </div>
          <div class="vehicle-field">
            <span class="field-label">{{ $t('vehicle.model') }}</span>
            <span class="field-value">{{ vehicle.model }}</span>
          </div>
          <div class="vehicle-field">
            <span class="field-label">{{ $t('vehicle.year') }}</span>
            <span class="field-value">{{ vehicle.year ?? '-' }}</span>
          </div>
          <div class="vehicle-field">
            <span class="field-label">{{ $t('vehicle.customer') }}</span>
            <span class="field-value">{{ customerMap.get(vehicle.customer_id) ?? '' }}</span>
          </div>
        </div>
      </IndustrialCard>
    </div>

    <n-empty v-if="filteredVehicles.length === 0" :description="$t('app.empty')" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NEmpty,
  NInput,
  NSelect
} from 'naive-ui'
import { Pencil, Trash2, Clock } from 'lucide-vue-next'
import { useVehicleStore } from '../../stores/vehicles'
import { useCustomerStore } from '../../stores/customers'
import IndustrialCard from '../../components/industrial/IndustrialCard.vue'
import type { Vehicle } from '../../../shared/types'

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
  color: var(--bi-on-surface);
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

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--bi-space-2);
}

.vehicle-card :deep(.industrial-card__title) {
  font: var(--bi-data-mono);
  text-transform: uppercase;
}

.vehicle-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bi-space-2);
}

.vehicle-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font: var(--bi-label-bold);
  letter-spacing: var(--bi-label-bold-letter-spacing);
  text-transform: uppercase;
  font-size: 11px;
  color: var(--bi-on-surface-variant);
}

.field-value {
  color: var(--bi-on-surface);
}

.mono-text {
  font: var(--bi-data-mono);
}

.row-actions {
  display: flex;
  gap: var(--bi-space-1);
}
</style>
