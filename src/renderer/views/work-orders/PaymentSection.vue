<template>
  <IndustrialCard :title="$t('payment.title')">
    <template #header-actions>
      <n-button v-if="!isLocked" type="primary" size="small" data-testid="payment-add" @click="handleAdd">
        {{ $t('payment.add') }}
      </n-button>
    </template>

    <div class="balance-summary">
      <div class="balance-item">
        <span class="balance-label">{{ $t('workOrder.totalCost') }}</span>
        <span class="balance-value">{{ formatCurrency(props.totalCost) }}</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">{{ $t('payment.runningTotal') }}</span>
        <span class="balance-value">{{ formatCurrency(runningTotal) }}</span>
      </div>
      <div class="balance-item">
        <span class="balance-label">{{ $t('payment.remainingBalance') }}</span>
        <span class="balance-value" :class="{ 'balance-negative': remainingBalance < 0 }">
          {{ formatCurrency(remainingBalance) }}
        </span>
      </div>
    </div>

    <n-empty v-if="payments.length === 0" :description="$t('app.empty')" />

    <div v-for="payment in payments" :key="payment.id" class="payment-row">
      <div v-if="editingId === payment.id" class="payment-edit-form">
        <n-date-picker
          v-model:formatted-value="editForm.payment_date"
          type="date"
          value-format="yyyy-MM-dd"
          class="edit-field"
        />
        <n-select
          v-model:value="editForm.payment_method"
          :options="methodOptions"
          class="edit-field"
        />
        <n-input-number
          v-model:value="editForm.amount"
          :min="0.01"
          :precision="2"
          class="edit-field"
        />
        <n-input
          v-model:value="editForm.notes"
          :placeholder="$t('payment.notes')"
          class="edit-field"
        />
        <div class="edit-actions">
          <n-button size="small" type="primary" @click="handleSave">
            {{ $t('app.save') }}
          </n-button>
          <n-button size="small" @click="handleCancel">
            {{ $t('app.cancel') }}
          </n-button>
        </div>
      </div>
      <div v-else class="payment-display">
        <div class="payment-info">
          <span class="payment-date">{{ formatDate(payment.payment_date) }}</span>
          <n-tag size="small" class="payment-method">
            {{ $t(`payment.method${capitalize(payment.payment_method)}`) }}
          </n-tag>
          <span class="payment-amount">{{ formatCurrency(payment.amount) }}</span>
          <span v-if="payment.notes" class="payment-notes">{{ payment.notes }}</span>
        </div>
        <div v-if="!isLocked" class="payment-actions">
          <n-button size="small" quaternary @click="handleEdit(payment)">
            {{ $t('app.edit') }}
          </n-button>
          <n-button size="small" quaternary type="error" @click="handleDelete(payment)">
            {{ $t('app.delete') }}
          </n-button>
        </div>
      </div>
    </div>

    <div v-if="isAdding" class="payment-row payment-edit-form">
      <n-date-picker
        v-model:formatted-value="newForm.payment_date"
        type="date"
        value-format="yyyy-MM-dd"
        class="edit-field"
      />
      <n-select
        v-model:value="newForm.payment_method"
        :options="methodOptions"
        class="edit-field"
      />
      <n-input-number
        v-model:value="newForm.amount"
        :min="0.01"
        :precision="2"
        class="edit-field"
        :input-props="{ 'data-testid': 'payment-amount' }"
      />
      <n-input
        v-model:value="newForm.notes"
        :placeholder="$t('payment.notes')"
        class="edit-field"
      />
      <div class="edit-actions">
        <n-button size="small" type="primary" data-testid="payment-save" @click="handleCreate">
          {{ $t('app.save') }}
        </n-button>
        <n-button size="small" @click="cancelAdd">
          {{ $t('app.cancel') }}
        </n-button>
      </div>
    </div>
  </IndustrialCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NDatePicker,
  NEmpty,
  NInput,
  NInputNumber,
  NSelect,
  NTag
} from 'naive-ui'
import { usePaymentStore } from '../../stores/payments'
import IndustrialCard from '../../components/industrial/IndustrialCard.vue'
import type { Payment, PaymentCreate, PaymentMethod, PaymentUpdate, WorkOrderPaymentStatus } from '../../../shared/types'

const props = defineProps<{
  workOrderId: number
  totalCost: number
  paymentStatus: WorkOrderPaymentStatus
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const { t } = useI18n()
const paymentStore = usePaymentStore()

const payments = ref<Payment[]>([])
const editingId = ref<number | null>(null)
const isAdding = ref(false)

const editForm = ref<PaymentUpdate & { payment_date: string; payment_method: PaymentMethod; amount: number; notes: string }>({
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  amount: 0,
  notes: ''
})

const newForm = ref<PaymentCreate>({
  work_order_id: props.workOrderId,
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  amount: 0,
  notes: null
})

const isLocked = computed(() => props.paymentStatus === 'paid')

const methodOptions = computed(() => [
  { label: t('payment.methodCash'), value: 'cash' as PaymentMethod },
  { label: t('payment.methodCard'), value: 'card' as PaymentMethod },
  { label: t('payment.methodTransfer'), value: 'transfer' as PaymentMethod }
])

const runningTotal = computed(() => {
  return payments.value.reduce((sum, p) => sum + p.amount, 0)
})

const remainingBalance = computed(() => {
  return props.totalCost - runningTotal.value
})

onMounted(() => {
  void loadPayments()
})

watch(() => props.workOrderId, () => {
  void loadPayments()
})

async function loadPayments(): Promise<void> {
  await paymentStore.loadByWorkOrder(props.workOrderId)
  payments.value = paymentStore.payments
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString()
}

function capitalize(value: PaymentMethod): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function handleAdd(): void {
  newForm.value = {
    work_order_id: props.workOrderId,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: 'cash',
    amount: remainingBalance.value > 0 ? remainingBalance.value : 0,
    notes: null
  }
  isAdding.value = true
}

function cancelAdd(): void {
  isAdding.value = false
}

function handleEdit(payment: Payment): void {
  editingId.value = payment.id
  editForm.value = {
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    amount: payment.amount,
    notes: payment.notes ?? ''
  }
}

function handleCancel(): void {
  editingId.value = null
}

async function handleCreate(): Promise<void> {
  try {
    await paymentStore.create({
      ...newForm.value,
      amount: newForm.value.amount ?? 0
    })
    isAdding.value = false
    await loadPayments()
    emit('updated')
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleSave(): Promise<void> {
  if (editingId.value === null) return
  try {
    await paymentStore.update(editingId.value, {
      work_order_id: props.workOrderId,
      amount: editForm.value.amount,
      payment_method: editForm.value.payment_method,
      payment_date: editForm.value.payment_date,
      notes: editForm.value.notes || null
    })
    editingId.value = null
    await loadPayments()
    emit('updated')
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleDelete(payment: Payment): Promise<void> {
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    await paymentStore.remove(payment.id, props.workOrderId)
    await loadPayments()
    emit('updated')
  } catch {
    window.alert(t('app.error'))
  }
}
</script>

<style scoped>
.balance-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--bi-space-2);
  margin-bottom: var(--bi-space-3);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container);
  border-radius: var(--bi-radius-md);
}

.balance-item {
  display: flex;
  flex-direction: column;
}

.balance-label {
  font-size: 0.875rem;
  color: var(--bi-on-surface-variant);
}

.balance-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--bi-on-surface);
}

.balance-negative {
  color: var(--bi-error);
}

.payment-row {
  margin-bottom: var(--bi-space-2);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container);
  border-radius: var(--bi-radius-md);
}

.payment-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: var(--bi-space-2);
  flex-wrap: wrap;
}

.payment-date {
  font-weight: 500;
  color: var(--bi-on-surface);
}

.payment-amount {
  font-weight: 600;
  color: var(--bi-on-surface);
}

.payment-notes {
  color: var(--bi-on-surface-variant);
  font-size: 0.875rem;
}

.payment-actions {
  display: flex;
  gap: var(--bi-space-1);
}

.payment-edit-form {
  display: grid;
  grid-template-columns: repeat(4, 1fr) auto;
  gap: var(--bi-space-2);
  align-items: center;
}

.edit-field {
  min-width: 120px;
}

.edit-actions {
  display: flex;
  gap: var(--bi-space-1);
}
</style>
