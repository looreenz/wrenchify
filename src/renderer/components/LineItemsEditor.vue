<template>
  <IndustrialCard :title="$t(titleKey)" class="line-items-editor">
    <template #header-actions>
      <n-button v-if="!readOnly" type="primary" size="small" @click="handleAdd">
        {{ $t('app.new') }}
      </n-button>
    </template>

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
          v-if="item.item_type === 'parts'"
          v-model:value="item.customer_price"
          :disabled="readOnly || editingId !== item.id"
          :min="0"
          :precision="2"
          :placeholder="$t('lineItem.customerPrice')"
          class="item-price"
        />
        <n-input-number
          v-if="showWorkshopPrice && item.item_type === 'parts'"
          v-model:value="item.workshop_price"
          :disabled="readOnly || editingId !== item.id"
          :min="0"
          :precision="2"
          :placeholder="$t('lineItem.workshopPrice')"
          class="item-price"
        />
        <n-input-number
          v-if="item.item_type === 'labor'"
          v-model:value="hourlyRateProxy"
          disabled
          :min="0"
          :precision="2"
          :placeholder="$t('quote.hourlyRate')"
          class="item-price"
        />
        <span class="item-total">{{ formatCurrency(rowCustomerTotal(item)) }}</span>
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

    <div v-if="items.length > 0" class="line-items-summary">
      <div class="summary-row">
        <strong>{{ $t('quote.customerTotal') }}:</strong>
        {{ formatCurrency(totals.customer_total) }}
      </div>
      <div v-if="showWorkshopPrice" class="summary-row">
        <strong>{{ $t('quote.workshopTotal') }}:</strong>
        {{ formatCurrency(totals.workshop_total) }}
      </div>
      <div v-if="showWorkshopPrice" class="summary-row profit-row">
        <strong>{{ $t('quote.netProfit') }}:</strong>
        {{ formatCurrency(totals.net_profit) }}
      </div>
    </div>
  </IndustrialCard>
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
import { useQuoteStore } from '../stores/quotes'
import IndustrialCard from './industrial/IndustrialCard.vue'
import { calcTotals } from '../../shared/calcTotals'
import type {
  DocumentTotals,
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
  WorkOrderItem,
  WorkOrderItemCreate,
  WorkOrderItemType,
  WorkOrderItemUpdate
} from '../../shared/types'

type Item = QuoteItem | WorkOrderItem
type ItemCreate = QuoteItemCreate | WorkOrderItemCreate
type ItemUpdate = QuoteItemUpdate | WorkOrderItemUpdate
type Variant = 'quote' | 'workOrder'

const props = defineProps<{
  variant: Variant
  documentId: number
  vatRate: number
  showWorkshopPrice: boolean
  readOnly?: boolean
}>()

const emit = defineEmits<{
  (e: 'updated', totals: DocumentTotals): void
}>()

const { t } = useI18n()
const workOrderStore = useWorkOrderStore()
const quoteStore = useQuoteStore()

const items = ref<Item[]>([])
const editingId = ref<number | null>(null)
const originalItem = ref<Item | null>(null)
const documentLaborHours = ref(0)
const documentHourlyRate = ref(0)

const titleKey = computed(() =>
  props.variant === 'quote' ? 'quote.items' : 'workOrder.lineItems'
)

const typeOptions = computed(() => [
  { label: t('lineItem.typeParts'), value: 'parts' as WorkOrderItemType },
  { label: t('lineItem.typeLabor'), value: 'labor' as WorkOrderItemType }
])

const hourlyRateProxy = computed(() => documentHourlyRate.value)

const totals = computed<DocumentTotals>(() =>
  calcTotals(
    items.value,
    documentLaborHours.value,
    documentHourlyRate.value,
    props.vatRate
  )
)

onMounted(() => {
  void loadItems()
})

watch(() => props.documentId, () => {
  void loadItems()
})

watch(totals, (next) => {
  emit('updated', next)
}, { immediate: true })

async function loadItems(): Promise<void> {
  if (props.variant === 'quote') {
    const quote = await quoteStore.getById(props.documentId)
    if (quote) {
      documentLaborHours.value = quote.labor_hours ?? 0
      documentHourlyRate.value = quote.hourly_rate ?? 0
    }
    items.value = await quoteStore.getLineItems(props.documentId)
  } else {
    const workOrder = await workOrderStore.getById(props.documentId)
    if (workOrder) {
      documentLaborHours.value = workOrder.labor_hours ?? 0
      documentHourlyRate.value = workOrder.hourly_rate ?? 0
    }
    items.value = await workOrderStore.getLineItems(props.documentId)
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function rowCustomerTotal(item: Item): number {
  if (item.item_type === 'labor') {
    return Math.round(item.quantity * documentHourlyRate.value * (1 + props.vatRate) * 100) / 100
  }
  return Math.round(item.quantity * item.customer_price * (1 + props.vatRate) * 100) / 100
}

function handleAdd(): void {
  const newItem: Item = {
    id: 0,
    [props.variant === 'quote' ? 'quote_id' : 'work_order_id']: props.documentId,
    description: '',
    quantity: 1,
    customer_price: 0,
    workshop_price: 0,
    item_type: 'parts',
    created_at: '',
    updated_at: ''
  } as Item
  items.value.push(newItem)
  editingId.value = 0
}

function handleEdit(item: Item): void {
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

async function handleSave(item: Item): Promise<void> {
  try {
    const payload: ItemCreate = {
      description: item.description,
      quantity: item.quantity,
      item_type: item.item_type,
      ...(item.item_type === 'parts'
        ? {
            customer_price: item.customer_price,
            workshop_price: item.workshop_price
          }
        : {})
    }
    if (item.id === 0) {
      if (props.variant === 'quote') {
        await quoteStore.addLineItem(props.documentId, payload as QuoteItemCreate)
      } else {
        await workOrderStore.addLineItem(props.documentId, payload as WorkOrderItemCreate)
      }
    } else {
      if (props.variant === 'quote') {
        await quoteStore.updateLineItem(item.id, payload as QuoteItemUpdate)
      } else {
        await workOrderStore.updateLineItem(item.id, payload as WorkOrderItemUpdate)
      }
    }
    editingId.value = null
    originalItem.value = null
    await loadItems()
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleDelete(item: Item): Promise<void> {
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    if (props.variant === 'quote') {
      await quoteStore.deleteLineItem(item.id)
    } else {
      await workOrderStore.deleteLineItem(item.id)
    }
    await loadItems()
  } catch {
    window.alert(t('app.error'))
  }
}
</script>

<style scoped>
.line-items-editor {
  margin-top: var(--bi-space-3);
}

.line-item-row {
  display: flex;
  align-items: flex-start;
  gap: var(--bi-space-2);
  margin-bottom: var(--bi-space-2);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container);
  border-radius: var(--bi-radius-md);
}

.item-fields {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  gap: var(--bi-space-2);
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

.item-quantity,
.item-price,
.item-total {
  font: var(--bi-data-mono);
}

.item-total {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  color: var(--bi-on-surface);
}

.item-actions {
  display: flex;
  gap: var(--bi-space-1);
}

.line-items-summary {
  margin-top: var(--bi-space-2);
  text-align: right;
  font-size: 1rem;
  color: var(--bi-on-surface);
}

.summary-row {
  margin-top: var(--bi-space-1);
}

.profit-row {
  color: var(--bi-success);
  font-weight: 600;
}
</style>
