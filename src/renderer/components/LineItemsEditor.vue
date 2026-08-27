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
        <div class="field-group">
          <label class="field-label">{{ $t('lineItem.description') }}</label>
          <n-input
            v-model:value="item.description"
            :disabled="readOnly || editingId !== item.id"
            :placeholder="$t('lineItem.description')"
            class="item-description"
          />
        </div>
        <div class="field-group">
          <label class="field-label">{{ $t('lineItem.quantity') }}</label>
          <n-input-number
            v-model:value="item.quantity"
            :disabled="readOnly || editingId !== item.id"
            :min="1"
            :placeholder="$t('lineItem.quantity')"
            class="item-quantity"
          />
        </div>
        <div class="field-group">
          <label class="field-label">{{ $t('lineItem.customerPrice') }}</label>
          <n-input-number
            v-model:value="item.customer_price"
            :disabled="readOnly || editingId !== item.id"
            :min="0"
            :precision="2"
            :placeholder="$t('lineItem.customerPrice')"
            class="item-price"
          />
        </div>
        <div v-if="showWorkshopPrice" class="field-group">
          <label class="field-label">{{ $t('lineItem.workshopPrice') }}</label>
          <n-input-number
            v-model:value="item.workshop_price"
            :disabled="readOnly || editingId !== item.id"
            :min="0"
            :precision="2"
            :placeholder="$t('lineItem.workshopPrice')"
            class="item-price"
          />
        </div>
        <div class="field-group totals">
          <label class="field-label">{{ $t('lineItem.totals') }}</label>
          <div class="item-totals">
            <div class="total-line">
              <span class="total-label">{{ $t('lineItem.customer') }}:</span>
              <span class="total-value">{{ formatCurrency(rowCustomerTotal(item)) }}</span>
            </div>
            <div v-if="showWorkshopPrice" class="total-line">
              <span class="total-label">{{ $t('lineItem.workshop') }}:</span>
              <span class="total-value">{{ formatCurrency(rowWorkshopTotal(item)) }}</span>
            </div>
          </div>
        </div>
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
        <strong>{{ $t('quote.partsTotal') }}:</strong>
        {{ formatCurrency(partsTotals.customer_total) }}
      </div>
      <div v-if="showWorkshopPrice" class="summary-row">
        <strong>{{ $t('quote.workshopTotal') }}:</strong>
        {{ formatCurrency(partsTotals.workshop_total) }}
      </div>
      <div v-if="showWorkshopPrice" class="summary-row profit-row">
        <strong>{{ $t('quote.netProfit') }}:</strong>
        {{ formatCurrency(partsTotals.net_profit) }}
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
  NInputNumber
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
  documentId: number | null
  vatRate: number
  showWorkshopPrice: boolean
  readOnly?: boolean
  laborHours?: number
  hourlyRate?: number
}>()

const emit = defineEmits<{
  (e: 'updated', totals: DocumentTotals): void
  (e: 'items-changed', items: Item[]): void
}>()

const { t } = useI18n()
const workOrderStore = useWorkOrderStore()
const quoteStore = useQuoteStore()

const items = ref<Item[]>([])
const editingId = ref<number | null>(null)
const originalItem = ref<Item | null>(null)
const documentLaborHours = ref(0)
const documentHourlyRate = ref(0)

const isDraft = computed(() => props.documentId === null)

const titleKey = computed(() =>
  props.variant === 'quote' ? 'quote.items' : 'workOrder.lineItems'
)

const totals = computed<DocumentTotals>(() =>
  calcTotals(
    items.value,
    documentLaborHours.value,
    documentHourlyRate.value,
    props.vatRate
  )
)

const partsTotals = computed<DocumentTotals>(() => {
  const partsItems = items.value.filter(item => item.item_type === 'parts')
  return calcTotals(partsItems, 0, 0, props.vatRate)
})

onMounted(() => {
  if (!isDraft.value) {
    void loadItems()
  } else {
    documentLaborHours.value = props.laborHours ?? 0
    documentHourlyRate.value = props.hourlyRate ?? 0
  }
})

watch(() => props.documentId, (newId) => {
  if (newId !== null) {
    void loadItems()
  }
})

watch(() => props.laborHours, (hours) => {
  if (isDraft.value) {
    documentLaborHours.value = hours ?? 0
  }
})

watch(() => props.hourlyRate, (rate) => {
  if (isDraft.value) {
    documentHourlyRate.value = rate ?? 0
  }
})

watch(totals, (next) => {
  emit('updated', next)
}, { immediate: true })

watch(items, () => {
  if (isDraft.value) {
    emit('items-changed', items.value)
  }
}, { deep: true })

async function loadItems(): Promise<void> {
  if (props.documentId === null) return
  
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

function getDraftItems(): Item[] {
  return items.value
}

defineExpose({ getDraftItems })

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function rowCustomerTotal(item: Item): number {
  if (item.item_type === 'labor') {
    // No VAT on labor
    return Math.round(item.quantity * documentHourlyRate.value * 100) / 100
  }
  return Math.round(item.quantity * item.customer_price * (1 + props.vatRate) * 100) / 100
}

function rowWorkshopTotal(item: Item): number {
  if (item.item_type === 'labor') {
    return 0
  }
  return Math.round(item.quantity * item.workshop_price * (1 + props.vatRate) * 100) / 100
}

function handleAdd(): void {
  const newItem: Item = {
    id: isDraft.value ? Date.now() : 0,
    [props.variant === 'quote' ? 'quote_id' : 'work_order_id']: props.documentId ?? 0,
    description: '',
    quantity: 1,
    customer_price: 0,
    workshop_price: 0,
    item_type: 'parts',
    created_at: '',
    updated_at: ''
  } as Item
  items.value.push(newItem)
  editingId.value = newItem.id
}

function handleEdit(item: Item): void {
  originalItem.value = { ...item }
  editingId.value = item.id
}

function handleCancel(): void {
  if (isDraft.value && editingId.value !== null) {
    const index = items.value.findIndex((i) => i.id === editingId.value)
    if (index !== -1 && items.value[index].description === '' && items.value[index].customer_price === 0) {
      items.value.splice(index, 1)
    } else if (originalItem.value) {
      items.value[index] = { ...originalItem.value }
    }
  } else if (editingId.value === 0 && originalItem.value === null) {
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
  if (isDraft.value) {
    editingId.value = null
    originalItem.value = null
    return
  }
  
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
        await quoteStore.addLineItem(props.documentId!, payload as QuoteItemCreate)
      } else {
        await workOrderStore.addLineItem(props.documentId!, payload as WorkOrderItemCreate)
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
  if (isDraft.value) {
    const index = items.value.findIndex((i) => i.id === item.id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
    return
  }
  
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
  width: 100%;
}

.line-item-row {
  display: flex;
  align-items: flex-start;
  gap: var(--bi-space-3);
  margin-bottom: var(--bi-space-3);
  padding: var(--bi-space-3);
  background-color: var(--bi-surface-container);
  border-radius: var(--bi-radius-md);
}

.item-fields {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1.5fr 2fr;
  gap: var(--bi-space-3);
  flex: 1;
  align-items: flex-start;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--bi-space-1);
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--bi-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-description {
  min-width: 200px;
}

.item-quantity,
.item-price {
  min-width: 120px;
}

.item-quantity,
.item-price {
  font: var(--bi-data-mono);
}

.field-group.totals {
  min-width: 200px;
}

.item-totals {
  display: flex;
  flex-direction: column;
  gap: var(--bi-space-1);
  font: var(--bi-data-mono);
}

.total-line {
  display: flex;
  justify-content: space-between;
  gap: var(--bi-space-2);
  font-size: 0.875rem;
}

.total-label {
  color: var(--bi-on-surface-variant);
  font-weight: 500;
}

.total-value {
  font-weight: 600;
  color: var(--bi-on-surface);
  white-space: nowrap;
}

.item-actions {
  display: flex;
  gap: var(--bi-space-1);
  align-items: flex-end;
  padding-bottom: var(--bi-space-1);
}

.line-items-summary {
  margin-top: var(--bi-space-3);
  text-align: right;
  font-size: 1rem;
  color: var(--bi-on-surface);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container-low);
  border-radius: var(--bi-radius-md);
}

.summary-row {
  margin-top: var(--bi-space-1);
}

.profit-row {
  color: var(--bi-success);
  font-weight: 600;
}
</style>
