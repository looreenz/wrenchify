<template>
  <div class="line-items-editor">
    <div class="section-header">
      <h3>{{ $t('workOrder.lineItems') }}</h3>
      <n-button v-if="!readOnly" type="primary" size="small" @click="handleAdd">
        {{ $t('app.new') }}
      </n-button>
    </div>

    <n-empty v-if="items.length === 0" :description="$t('app.empty')" />

    <div v-for="(item, index) in items" :key="item.id ?? `draft-${index}`" class="line-item-row">
      <div class="item-fields">
        <n-input
          v-model:value="item.description"
          :disabled="readOnly || editingId !== item.id"
          :placeholder="$t('lineItem.description')"
          class="item-description"
        />
        <n-select
          v-model:value="item.item_type"
          :disabled="readOnly || editingId !== item.id"
          :options="typeOptions"
          class="item-type"
        />
        <n-input-number
          v-model:value="item.quantity"
          :disabled="readOnly || editingId !== item.id"
          :min="1"
          :placeholder="$t('lineItem.quantity')"
          class="item-quantity"
        />
        <n-input-number
          v-model:value="item.unit_price"
          :disabled="readOnly || editingId !== item.id"
          :min="0"
          :precision="2"
          :placeholder="$t('lineItem.unitPrice')"
          class="item-price"
        />
        <span class="item-total">{{ formatCurrency(item.quantity * item.unit_price) }}</span>
      </div>
      <div v-if="!readOnly" class="item-actions">
        <template v-if="editingId === item.id">
          <n-button size="small" type="primary" @click="handleSave(item)">
            {{ $t('app.save') }}
          </n-button>
          <n-button size="small" @click="handleCancel">
            {{ $t('app.cancel') }}
          </n-button>
        </template>
        <template v-else>
          <n-button size="small" quaternary @click="handleEdit(item)">
            {{ $t('app.edit') }}
          </n-button>
          <n-button size="small" quaternary type="error" @click="handleDelete(item)">
            {{ $t('app.delete') }}
          </n-button>
        </template>
      </div>
    </div>

    <div v-if="items.length > 0" class="line-items-total">
      <strong>{{ $t('payment.runningTotal') }}:</strong>
      {{ formatCurrency(itemsTotal) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NEmpty,
  NInput,
  NInputNumber,
  NSelect
} from 'naive-ui'
import { useWorkOrderStore } from '../stores/workOrders'
import type { WorkOrderItem, WorkOrderItemCreate, WorkOrderItemType } from '../../shared/types'

const props = defineProps<{
  workOrderId: number
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'updated', total: number): void
}>()

const { t } = useI18n()
const workOrderStore = useWorkOrderStore()

const items = ref<WorkOrderItem[]>([])
const editingId = ref<number | null>(null)
const originalItem = ref<WorkOrderItem | null>(null)

const typeOptions = computed(() => [
  { label: t('lineItem.typeParts'), value: 'parts' as WorkOrderItemType },
  { label: t('lineItem.typeLabor'), value: 'labor' as WorkOrderItemType }
])

const itemsTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
})

onMounted(() => {
  void loadItems()
})

watch(() => props.workOrderId, () => {
  void loadItems()
})

async function loadItems(): Promise<void> {
  items.value = await workOrderStore.getLineItems(props.workOrderId)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function handleAdd(): void {
  const newItem: WorkOrderItem = {
    id: 0,
    work_order_id: props.workOrderId,
    description: '',
    quantity: 1,
    unit_price: 0,
    item_type: 'parts',
    created_at: '',
    updated_at: ''
  }
  items.value.push(newItem)
  editingId.value = 0
}

function handleEdit(item: WorkOrderItem): void {
  originalItem.value = { ...item }
  editingId.value = item.id
}

function handleCancel(): void {
  if (editingId.value === 0 && originalItem.value === null) {
    items.value.pop()
  } else if (originalItem.value) {
    const index = items.value.findIndex((i) => i.id === originalItem.value?.id)
    if (index !== -1) {
      items.value[index] = { ...originalItem.value }
    }
  }
  editingId.value = null
  originalItem.value = null
}

async function handleSave(item: WorkOrderItem): Promise<void> {
  try {
    const payload: WorkOrderItemCreate = {
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      item_type: item.item_type
    }
    if (item.id === 0) {
      await workOrderStore.addLineItem(props.workOrderId, payload)
    } else {
      await workOrderStore.updateLineItem(item.id, payload)
    }
    editingId.value = null
    originalItem.value = null
    await loadItems()
    emit('updated', itemsTotal.value)
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleDelete(item: WorkOrderItem): Promise<void> {
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    await workOrderStore.deleteLineItem(item.id)
    await loadItems()
    emit('updated', itemsTotal.value)
  } catch {
    window.alert(t('app.error'))
  }
}
</script>

<style scoped>
.line-items-editor {
  margin-top: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.line-item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.item-fields {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  flex: 1;
  align-items: center;
}

.item-description {
  min-width: 160px;
}

.item-type,
.item-quantity,
.item-price {
  min-width: 100px;
}

.item-total {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.line-items-total {
  margin-top: 16px;
  text-align: right;
  font-size: 1rem;
}
</style>
