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

        <div class="form-row form-row-three">
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
          <n-form-item :label="$t('workOrder.partsCost')" path="parts_cost">
            <n-input-number
              v-model:value="formValue.parts_cost"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
            />
          </n-form-item>
        </div>

        <div class="total-cost">
          <strong>{{ $t('workOrder.totalCost') }}:</strong>
          {{ formatCurrency(displayTotalCost) }}
        </div>

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

      <template v-if="workOrderId !== null">
        <LineItemsEditor
          :work-order-id="workOrderId"
          :read-only="isReadOnly"
          class="line-items-section"
          @updated="handleLineItemsUpdated"
        />
        <PaymentSection
          :work-order-id="workOrderId"
          :total-cost="workOrderTotalCost"
          :payment-status="paymentStatus"
          class="payments-section"
          @updated="handlePaymentUpdated"
        />
      </template>
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
import type { WorkOrder, WorkOrderCreate, WorkOrderUpdate } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const workOrderStore = useWorkOrderStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()
const settingsStore = useSettingsStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const workOrderId = ref<number | null>(null)
const workOrderTotalCost = ref(0)
const paymentStatus = ref<'pending' | 'partial' | 'paid'>('pending')
const lineItemsTotal = ref(0)

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
  parts_cost: 0,
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

const displayTotalCost = computed(() => {
  const labor = (formValue.labor_hours ?? 0) * (formValue.hourly_rate ?? 0)
  const parts = formValue.parts_cost ?? 0
  return Math.round((labor + parts + lineItemsTotal.value) * 100) / 100
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
  void customerStore.load()
  void vehicleStore.load()
  void settingsStore.load()

  const quoteIdParam = route.query.quoteId
  if (quoteIdParam && !isEdit.value) {
    formValue.quote_id = Number(quoteIdParam)
  }

  if (isEdit.value) {
    workOrderId.value = Number(route.params.id)
    loading.value = true
    try {
      const workOrder = await workOrderStore.getById(workOrderId.value)
      if (workOrder) {
        populateForm(workOrder)
        workOrderTotalCost.value = workOrder.total_cost
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
  formValue.parts_cost = workOrder.parts_cost
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
    } else {
      const created = await workOrderStore.create(payload as WorkOrderCreate)
      workOrderId.value = created.id
      paymentStatus.value = created.payment_status
      workOrderTotalCost.value = created.total_cost
    }
    void router.push({ name: 'WorkOrderList' })
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
    parts_cost: formValue.parts_cost ?? 0,
    notes: formValue.notes || null
  }
}

function handleLineItemsUpdated(total: number): void {
  lineItemsTotal.value = total
  if (workOrderId.value !== null) {
    void refreshWorkOrder()
  }
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
    workOrderTotalCost.value = workOrder.total_cost
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
  max-width: 900px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.form {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-row-three {
  grid-template-columns: 1fr 1fr 1fr;
}

.date-picker,
.number-input {
  width: 100%;
}

.total-cost {
  font-size: 1.1rem;
  margin-bottom: 24px;
  padding: 12px;
  background-color: #f0f9eb;
  border-radius: 6px;
  color: #18a058;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.line-items-section,
.payments-section {
  margin-bottom: 24px;
}
</style>
