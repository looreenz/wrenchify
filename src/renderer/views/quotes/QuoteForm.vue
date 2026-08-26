<template>
  <div class="quote-form">
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
        <n-alert v-if="isReadOnly" type="info" class="readonly-alert">
          {{ $t('quote.detail') }}
        </n-alert>

        <div class="form-row">
          <n-form-item :label="$t('quote.customer')" path="customer_id">
            <n-select
              v-model:value="formValue.customer_id"
              :disabled="isReadOnly"
              :options="customerOptions"
              :placeholder="$t('quote.customer')"
              @update:value="handleCustomerChange"
            />
          </n-form-item>
          <n-form-item :label="$t('quote.vehicle')" path="vehicle_id">
            <n-select
              v-model:value="formValue.vehicle_id"
              :disabled="isReadOnly || !formValue.customer_id"
              :options="vehicleOptions"
              :placeholder="$t('quote.vehicle')"
            />
          </n-form-item>
        </div>

        <n-form-item :label="$t('quote.date')" path="date">
          <n-date-picker
            v-model:formatted-value="formValue.date"
            type="date"
            :disabled="isReadOnly"
            :placeholder="$t('quote.date')"
            value-format="yyyy-MM-dd"
            class="date-picker"
          />
        </n-form-item>

        <n-form-item :label="$t('quote.description')" path="description">
          <n-input
            v-model:value="formValue.description"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('quote.description')"
            :rows="3"
          />
        </n-form-item>

        <div class="form-row form-row-three">
          <n-form-item :label="$t('quote.laborHours')" path="labor_hours">
            <n-input-number
              v-model:value="formValue.labor_hours"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
              :input-props="{ 'data-testid': 'quote-labor-hours' }"
            />
          </n-form-item>
          <n-form-item :label="$t('quote.hourlyRate')" path="hourly_rate">
            <n-input-number
              v-model:value="formValue.hourly_rate"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
              :input-props="{ 'data-testid': 'quote-hourly-rate' }"
            />
          </n-form-item>
          <n-form-item :label="$t('quote.partsCost')" path="parts_cost">
            <n-input-number
              v-model:value="formValue.parts_cost"
              :disabled="isReadOnly"
              :min="0"
              :precision="2"
              class="number-input"
              :input-props="{ 'data-testid': 'quote-parts-cost' }"
            />
          </n-form-item>
        </div>

        <div class="total-cost">
          <strong>{{ $t('quote.totalCost') }}:</strong>
          {{ formatCurrency(totalCost) }}
        </div>

        <n-form-item :label="$t('quote.notes')" path="notes">
          <n-input
            v-model:value="formValue.notes"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('quote.notes')"
            :rows="3"
          />
        </n-form-item>

        <div class="form-actions">
          <n-button v-if="!isReadOnly" type="primary" @click="handleSave">
            {{ $t('app.save') }}
          </n-button>
          <HazardButton
            v-if="quoteId !== null"
            size="small"
            :disabled="quoteStatus === 'converted'"
            @click="handleDelete"
          >
            {{ $t('app.delete') }}
          </HazardButton>
          <n-button @click="handleCancel">
            {{ $t('app.cancel') }}
          </n-button>
        </div>
      </n-form>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin
} from 'naive-ui'
import { useQuoteStore } from '../../stores/quotes'
import HazardButton from '../../components/industrial/HazardButton.vue'
import { useCustomerStore } from '../../stores/customers'
import { useVehicleStore } from '../../stores/vehicles'
import { useSettingsStore } from '../../stores/settings'
import type { QuoteCreate, QuoteUpdate } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const quoteStore = useQuoteStore()
const customerStore = useCustomerStore()
const vehicleStore = useVehicleStore()
const settingsStore = useSettingsStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const quoteStatus = ref<string | null>(null)

const quoteId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEdit = computed(() => route.name === 'QuoteEdit')
const isReadOnly = computed(() => isEdit.value && quoteStatus.value !== null && quoteStatus.value !== 'draft')

const pageTitle = computed(() => {
  if (isReadOnly.value) return t('quote.detail')
  if (isEdit.value) return t('quote.edit')
  return t('quote.new')
})

const formValue = reactive<QuoteCreate & { date: string }>({
  customer_id: null as unknown as number,
  vehicle_id: null as unknown as number,
  date: new Date().toISOString().slice(0, 10),
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

const totalCost = computed(() => {
  const labor = (formValue.labor_hours ?? 0) * (formValue.hourly_rate ?? 0)
  const parts = formValue.parts_cost ?? 0
  return Math.round((labor + parts) * 100) / 100
})

const rules: FormRules = {
  customer_id: [
    {
      required: true,
      type: 'number',
      message: t('quote.validation.vehicleRequired'),
      trigger: ['blur', 'change']
    }
  ],
  vehicle_id: [
    {
      required: true,
      type: 'number',
      message: t('quote.validation.vehicleRequired'),
      trigger: ['blur', 'change']
    }
  ]
}

onMounted(async () => {
  await customerStore.load()
  await vehicleStore.load()
  void settingsStore.load()

  const customerIdParam = route.query.customerId
  const vehicleIdParam = route.query.vehicleId
  if (!isEdit.value && customerIdParam) {
    formValue.customer_id = Number(customerIdParam)
    handleCustomerChange()
    if (vehicleIdParam) {
      formValue.vehicle_id = Number(vehicleIdParam)
    }
  }

  if (quoteId.value !== null) {
    loading.value = true
    try {
      const quote = await quoteStore.getById(quoteId.value)
      if (quote) {
        quoteStatus.value = quote.status
        formValue.customer_id = quote.customer_id
        formValue.vehicle_id = quote.vehicle_id
        formValue.date = quote.date
        formValue.description = quote.description ?? ''
        formValue.labor_hours = quote.labor_hours
        formValue.hourly_rate = quote.hourly_rate
        formValue.parts_cost = quote.parts_cost
        formValue.notes = quote.notes ?? ''
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

function handleCustomerChange(): void {
  formValue.vehicle_id = null as unknown as number
}

function handleCancel(): void {
  void router.push({ name: 'QuoteList' })
}

async function handleDelete(): Promise<void> {
  if (quoteId.value === null) return
  if (!window.confirm(t('app.confirmDelete'))) return
  try {
    await quoteStore.remove(quoteId.value)
    void router.push({ name: 'QuoteList' })
  } catch {
    window.alert(t('app.error'))
  }
}

async function handleSave(): Promise<void> {
  await formRef.value?.validate()
  const payload = makePayload()
  try {
    if (isEdit.value && quoteId.value !== null) {
      await quoteStore.update(quoteId.value, payload as QuoteUpdate)
    } else {
      await quoteStore.create(payload as QuoteCreate)
    }
    void router.push({ name: 'QuoteList' })
  } catch {
    window.alert(t('app.error'))
  }
}

function makePayload(): QuoteCreate {
  return {
    customer_id: formValue.customer_id,
    vehicle_id: formValue.vehicle_id,
    date: formValue.date,
    description: formValue.description || null,
    labor_hours: formValue.labor_hours ?? 0,
    hourly_rate: formValue.hourly_rate ?? 0,
    parts_cost: formValue.parts_cost ?? 0,
    notes: formValue.notes || null
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
.quote-form {
  max-width: 800px;
}

.page-header {
  margin-bottom: var(--bi-space-3);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.form {
  background-color: var(--bi-surface-container-low);
  padding: var(--bi-space-3);
  border-radius: var(--bi-radius-lg);
}

.readonly-alert {
  margin-bottom: var(--bi-space-2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bi-space-2);
}

.form-row-three {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--bi-space-2);
}

.date-picker {
  width: 100%;
}

.number-input {
  width: 100%;
}

.total-cost {
  font-size: 1.1rem;
  margin-bottom: var(--bi-space-3);
  padding: var(--bi-space-2);
  background-color: var(--bi-surface-container-high);
  border-radius: var(--bi-radius-md);
  color: var(--bi-success);
}

.form-actions {
  display: flex;
  gap: var(--bi-space-2);
  margin-top: var(--bi-space-3);
}
</style>
