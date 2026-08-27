<template>
  <div class="work-order-form">
    <div class="page-header">
      <h1>{{ pageTitle }}</h1>
    </div>

    <n-spin :show="loading">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="top"
        class="form"
      >
        <div class="form-row">
          <n-form-item :label="$t('workOrder.customer')" path="customer_id">
            <n-select
              v-model:value="formValue.customer_id"
              :disabled="isReadOnly"
              :options="customerOptions"
              :placeholder="$t('workOrder.customer')"
              @update:value="handleCustomerChange"
            />
          </n-form-item>
          <n-form-item :label="$t('workOrder.vehicle')" path="vehicle_id">
            <n-select
              v-model:value="formValue.vehicle_id"
              :disabled="isReadOnly || !formValue.customer_id"
              :options="vehicleOptions"
              :placeholder="$t('workOrder.vehicle')"
            />
          </n-form-item>
        </div>

        <div class="form-row">
          <n-form-item :label="$t('workOrder.dateIn')" path="date_in">
            <n-date-picker
              v-model:formatted-value="formValue.date_in"
              type="date"
              :disabled="isReadOnly"
              :placeholder="$t('workOrder.dateIn')"
              value-format="yyyy-MM-dd"
              class="date-picker"
            />
          </n-form-item>
          <n-form-item :label="$t('workOrder.dateOut')" path="date_out">
            <n-date-picker
              v-model:formatted-value="formValue.date_out"
              type="date"
              :disabled="isReadOnly"
              :placeholder="$t('workOrder.dateOut')"
              value-format="yyyy-MM-dd"
              class="date-picker"
            />
          </n-form-item>
        </div>

        <div class="form-row">
          <n-form-item :label="$t('workOrder.mileageIn')" path="mileage_in">
            <n-input-number
              v-model:value="formValue.mileage_in"
              :disabled="isReadOnly"
              :min="0"
              class="number-input"
            />
          </n-form-item>
          <n-form-item :label="$t('workOrder.mileageOut')" path="mileage_out">
            <n-input-number
              v-model:value="formValue.mileage_out"
              :disabled="isReadOnly"
              :min="0"
              class="number-input"
            />
          </n-form-item>
        </div>

        <n-form-item :label="$t('workOrder.description')" path="description">
          <n-input
            v-model:value="formValue.description"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('workOrder.description')"
            :rows="3"
          />
        </n-form-item>

        <div class="form-row form-row-two">
          <n-form-item :label="$t('workOrder.laborHours')" path="labor_hours">
            <n-input-number
              v-model:value="formValue.labor_hours"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
            />
          </n-form-item>
          <n-form-item :label="$t('workOrder.hourlyRate')" path="hourly_rate">
            <n-input-number
              v-model:value="formValue.hourly_rate"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
            />
          </n-form-item>
        </div>

        <div class="totals-summary">
          <div class="total-row">
            <strong>{{ $t('workOrder.laborCost') }}:</strong>
            {{ formatCurrency(laborCost) }}
          </div>
          <div class="total-row">
            <strong>{{ $t('workOrder.partsTotal') }}:</strong>
            {{ formatCurrency(displayTotals.customer_total) }}
          </div>
          <div class="total-row">
            <strong>{{ $t('workOrder.workshopTotal') }}:</strong>
            {{ formatCurrency(displayTotals.workshop_total) }}
          </div>
          <div class="total-row profit-row">
            <strong>{{ $t('workOrder.netProfit') }}:</strong>
            {{ formatCurrency(netProfit) }}
          </div>
        </div>

        <LineItemsEditor
          v-if="workOrderId !== null"
          ref="lineItemsEditorRef"
          :variant="'workOrder'"
          :document-id="workOrderId"
          :vat-rate="vatRate"
          :show-workshop-price="true"
          :read-only="isReadOnly"
          :labor-hours="formValue.labor_hours"
          :hourly-rate="formValue.hourly_rate"
          class="line-items-section"
          @updated="handleLineItemsUpdated"
          @items-changed="handleDraftItemsChanged"
        />

        <n-form-item :label="$t('workOrder.notes')" path="notes">
          <n-input
            v-model:value="formValue.notes"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('workOrder.notes')"
            :rows="3"
          />
        </n-form-item>

        <div class="form-actions">
          <n-button v-if="!isReadOnly" type="primary" @click="handleSave">
            {{ $t('app.save') }}
          </n-button>
          <n-button @click="handleCancel">
            {{ $t('app.cancel') }}
          </n-button>
        </div>
      </n-form>

      <PaymentSection
        v-if="workOrderId !== null"
        :work-order-id="workOrderId"
        :total-cost="workOrderTotalCost"
        :payment-status="paymentStatus"
        class="payments-section"
        @updated="handlePaymentUpdated"
      />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin
} from 'naive-ui'
import { useWorkOrderStore } from '../../stores/workOrders'
import { useCustomerStore } from '../../stores/customers'
import { useVehicleStore } from '../../stores/vehicles'
import { useSettingsStore } from '../../stores/settings'
import LineItemsEditor from '../../components/LineItemsEditor.vue'
import PaymentSection from './PaymentSection.vue'
import { calcTotals } from '../../../shared/calcTotals'
import type { DocumentTotals, WorkOrder, WorkOrderCreate, WorkOrderUpdate } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const workOrderStore = useWorkOrderStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()
const settingsStore = useSettingsStore()

const formRef = ref<FormInst | null>(null)
const lineItemsEditorRef = ref<InstanceType<typeof LineItemsEditor> | null>(null)
const loading = ref(false)
const workOrderId = ref<number | null>(null)
const workOrderTotalCost = ref(0)
const paymentStatus = ref<'pending' | 'partial' | 'paid'>('pending')
const lineItemsTotals = ref<DocumentTotals | null>(null)
const draftItems = ref<Array<{ description: string; quantity: number; customer_price: number; workshop_price: number; item_type: string }>>([])

const isEdit = computed(() => route.name === 'WorkOrderEdit')
const isReadOnly = computed(() => false)

const pageTitle = computed(() => {
  if (isEdit.value) return t('workOrder.edit')
  return t('workOrder.new')
})

const formValue = reactive<WorkOrderCreate & { date_in: string }>({
  customer_id: null as unknown as number,
  vehicle_id: null as unknown as number,
  quote_id: null,
  date_in: new Date().toISOString().slice(0, 10),
  date_out: null,
  mileage_in: null,
  mileage_out: null,
  description: '',
  labor_hours: 0,
  hourly_rate: settingsStore.hourlyRate,
  notes: ''
})

const customerOptions = computed(() =>
  customerStore.customers.map((c) => ({
    label: `${c.first_name ?? ''} ${c.last_name}`.trim(),
    value: c.id
  }))
)

const vehicleOptions = computed(() =>
  vehicleStore.vehicles
    .filter((v) => v.customer_id === formValue.customer_id)
    .map((v) => ({
      label: `${v.make ?? ''} ${v.model} · ${v.license_plate}`,
      value: v.id
    }))
)

const vatRate = computed(() => settingsStore.vatRate)

const laborCost = computed(() => {
  const hours = formValue.labor_hours ?? 0
  const rate = formValue.hourly_rate ?? 0
  return hours * rate
})

const netProfit = computed(() => {
  return displayTotals.value.customer_total - displayTotals.value.workshop_total - laborCost.value
})

const displayTotals = computed<DocumentTotals>(() => {
  if (lineItemsTotals.value) {
    return lineItemsTotals.value
  }
  return calcTotals(
    [],
    formValue.labor_hours ?? 0,
    formValue.hourly_rate ?? 0,
    vatRate.value
  )
})

const rules: FormRules = {
  customer_id: [
    {
      required: true,
      type: 'number',
      message: t('workOrder.validation.vehicleRequired'),
      trigger: ['blur', 'change']
    }
  ],
  vehicle_id: [
    {
      required: true,
      type: 'number',
      message: t('workOrder.validation.vehicleRequired'),
      trigger: ['blur', 'change']
    }
  ],
  mileage_out: [
    {
      validator: (_rule, value: number | null) => {
        if (value === null || formValue.mileage_in === null) return true
        return value >= formValue.mileage_in
      },
      message: t('workOrder.validation.mileageOutGreater'),
      trigger: ['blur', 'change']
    }
  ]
}

onMounted(async () => {
  await customerStore.load()
  await vehicleStore.load()
  void settingsStore.load()

  const quoteIdParam = route.query.quoteId
  const customerIdParam = route.query.customerId
  const vehicleIdParam = route.query.vehicleId

  if (quoteIdParam && !isEdit.value) {
    formValue.quote_id = Number(quoteIdParam)
  } else if (!isEdit.value && customerIdParam) {
    formValue.customer_id = Number(customerIdParam)
    handleCustomerChange()
    if (vehicleIdParam) {
      formValue.vehicle_id = Number(vehicleIdParam)
    }
  }

  if (isEdit.value) {
    workOrderId.value = Number(route.params.id)
    loading.value = true
    try {
      const workOrder = await workOrderStore.getById(workOrderId.value)
      if (workOrder) {
        populateForm(workOrder)
        workOrderTotalCost.value = workOrder.customer_total
        paymentStatus.value = workOrder.payment_status
      }
    } finally {
      loading.value = false
    }
  }
})

watch(() => settingsStore.hourlyRate, (rate) => {
  if (!isEdit.value && rate !== undefined) {
    formValue.hourly_rate = rate
  }
})

function populateForm(workOrder: WorkOrder): void {
  formValue.customer_id = workOrder.customer_id
  formValue.vehicle_id = workOrder.vehicle_id
  formValue.quote_id = workOrder.quote_id
  formValue.date_in = workOrder.date_in
  formValue.date_out = workOrder.date_out
  formValue.mileage_in = workOrder.mileage_in
  formValue.mileage_out = workOrder.mileage_out
  formValue.description = workOrder.description ?? ''
  formValue.labor_hours = workOrder.labor_hours
  formValue.hourly_rate = workOrder.hourly_rate
  formValue.notes = workOrder.notes ?? ''
}

function handleCustomerChange(): void {
  formValue.vehicle_id = null as unknown as number
}

function handleCancel(): void {
  void router.push({ name: 'WorkOrderList' })
}

async function handleSave(): Promise<void> {
  await formRef.value?.validate()
  const payload = makePayload()
  try {
    if (isEdit.value && workOrderId.value !== null) {
      await workOrderStore.update(workOrderId.value, payload as WorkOrderUpdate)
      void router.push({ name: 'WorkOrderList' })
    } else {
      const created = await workOrderStore.create(payload as WorkOrderCreate)
      for (const item of draftItems.value) {
        await workOrderStore.addLineItem(created.id, {
          description: item.description,
          quantity: item.quantity,
          customer_price: item.customer_price,
          workshop_price: item.workshop_price,
          item_type: item.item_type as 'parts' | 'labor'
        })
      }
      void router.push({ name: 'WorkOrderList' })
    }
  } catch {
    window.alert(t('app.error'))
  }
}

function makePayload(): WorkOrderCreate {
  return {
    customer_id: formValue.customer_id,
    vehicle_id: formValue.vehicle_id,
    quote_id: formValue.quote_id,
    date_in: formValue.date_in,
    date_out: formValue.date_out || null,
    mileage_in: formValue.mileage_in ?? null,
    mileage_out: formValue.mileage_out ?? null,
    description: formValue.description || null,
    labor_hours: formValue.labor_hours ?? 0,
    hourly_rate: formValue.hourly_rate ?? 0,
    notes: formValue.notes || null
  }
}

function handleLineItemsUpdated(totals: DocumentTotals): void {
  lineItemsTotals.value = totals
  if (workOrderId.value !== null) {
    void refreshWorkOrder()
  }
}

function handleDraftItemsChanged(items: Array<{ description: string; quantity: number; customer_price: number; workshop_price: number; item_type: string }>): void {
  draftItems.value = items
}

function handlePaymentUpdated(): void {
  if (workOrderId.value !== null) {
    void refreshWorkOrder()
  }
}

async function refreshWorkOrder(): Promise<void> {
  if (workOrderId.value === null) return
  const workOrder = await workOrderStore.getById(workOrderId.value)
  if (workOrder) {
    workOrderTotalCost.value = workOrder.customer_total
    paymentStatus.value = workOrder.payment_status
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}
</script>

<style scoped>
.work-order-form {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--bi-space-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--bi-on-surface);
}

.form {
  background-color: var(--bi-surface-container-low);
  padding: var(--bi-space-3);
  border-radius: var(--bi-radius-lg);
  margin-bottom: var(--bi-space-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bi-space-2);
}

.form-row-two {
  grid-template-columns: 1fr 1fr;
}

.date-picker,
.number-input {
  width: 100%;
}

.totals-summary {
  font-size: 1.1rem;
  margin-bottom: var(--bi-space-3);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container-high);
  border-radius: var(--bi-radius-md);
  color: var(--bi-on-surface);
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--bi-space-1);
}

.profit-row {
  color: var(--bi-success);
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: var(--bi-space-2);
  margin-top: var(--bi-space-3);
}

.line-items-section,
.payments-section {
  margin-bottom: var(--bi-space-3);
}
</style>
