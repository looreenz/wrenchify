<template>
  <div class="vehicle-form">
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
        <n-form-item :label="$t('vehicle.customer')" path="customer_id">
          <n-select
            v-model:value="formValue.customer_id"
            :disabled="isReadOnly || customerLocked"
            :options="customerOptions"
            :placeholder="$t('vehicle.customer')"
          />
        </n-form-item>

        <div class="form-row">
          <n-form-item :label="$t('vehicle.licensePlate')" path="license_plate">
            <n-input
              v-model:value="formValue.license_plate"
              :disabled="isReadOnly"
              :placeholder="$t('vehicle.licensePlate')"
            />
          </n-form-item>
          <n-form-item :label="$t('vehicle.year')" path="year">
            <n-input-number
              v-model:value="formValue.year"
              :disabled="isReadOnly"
              :placeholder="$t('vehicle.year')"
              :min="1900"
              :max="currentYear"
              clearable
              class="year-input"
            />
          </n-form-item>
        </div>

        <div class="form-row">
          <n-form-item :label="$t('vehicle.make')" path="make">
            <n-input
              v-model:value="formValue.make"
              :disabled="isReadOnly"
              :placeholder="$t('vehicle.make')"
            />
          </n-form-item>
          <n-form-item :label="$t('vehicle.model')" path="model">
            <n-input
              v-model:value="formValue.model"
              :disabled="isReadOnly"
              :placeholder="$t('vehicle.model')"
            />
          </n-form-item>
        </div>

        <n-form-item :label="$t('vehicle.vin')" path="vin">
          <n-input
            v-model:value="formValue.vin"
            :disabled="isReadOnly"
            :placeholder="$t('vehicle.vin')"
            :maxlength="17"
          />
        </n-form-item>

        <n-form-item :label="$t('vehicle.notes')" path="notes">
          <n-input
            v-model:value="formValue.notes"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('vehicle.notes')"
            :rows="4"
          />
        </n-form-item>

        <div class="form-actions">
          <n-button v-if="!isReadOnly" type="primary" @click="handleSave">
            {{ $t('app.save') }}
          </n-button>
          <n-button v-if="isReadOnly" type="primary" @click="handleEdit">
            {{ $t('app.edit') }}
          </n-button>
          <n-button @click="handleCancel">
            {{ $t('app.cancel') }}
          </n-button>
        </div>
      </n-form>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin
} from 'naive-ui'
import { useVehicleStore } from '../../stores/vehicles'
import { useCustomerStore } from '../../stores/customers'
import type { VehicleCreate, VehicleUpdate } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const vehicleStore = useVehicleStore()
const customerStore = useCustomerStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const customerLocked = ref(false)
const currentYear = new Date().getFullYear()

const vehicleId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isReadOnly = computed(() => route.name === 'VehicleDetail')
const isEdit = computed(() => route.name === 'VehicleEdit')

const pageTitle = computed(() => {
  if (isReadOnly.value) return t('vehicle.detail')
  if (isEdit.value) return t('vehicle.edit')
  return t('vehicle.new')
})

const formValue = reactive<VehicleCreate>({
  customer_id: null as unknown as number,
  license_plate: '',
  make: '',
  model: '',
  year: null,
  vin: '',
  notes: ''
})

const customerOptions = computed(() =>
  customerStore.customers.map((c) => ({
    label: `${c.first_name ?? ''} ${c.last_name}`.trim(),
    value: c.id
  }))
)

const rules: FormRules = {
  customer_id: [
    {
      required: true,
      type: 'number',
      message: t('vehicle.validation.customerRequired'),
      trigger: ['blur', 'change']
    }
  ],
  license_plate: [
    {
      required: true,
      message: t('vehicle.validation.licensePlateRequired'),
      trigger: ['blur', 'input']
    }
  ],
  model: [
    {
      required: true,
      message: t('vehicle.validation.modelRequired'),
      trigger: ['blur', 'input']
    }
  ],
  year: [
    {
      validator: (_rule, value: number | null) => {
        if (value === null || value === undefined) return true
        return value >= 1900 && value <= currentYear
      },
      message: t('vehicle.validation.yearRange'),
      trigger: ['blur', 'change']
    }
  ],
  vin: [
    {
      validator: (_rule, value: string | null) => {
        if (!value) return true
        return value.length <= 17
      },
      message: t('vehicle.validation.vinLength'),
      trigger: ['blur', 'input']
    }
  ]
}

onMounted(async () => {
  void customerStore.load()

  const customerIdParam = route.query.customerId
  if (customerIdParam && !isEdit.value && !isReadOnly.value) {
    formValue.customer_id = Number(customerIdParam)
    customerLocked.value = true
  }

  if (vehicleId.value !== null) {
    loading.value = true
    try {
      const vehicle = await vehicleStore.getById(vehicleId.value)
      if (vehicle) {
        formValue.customer_id = vehicle.customer_id
        formValue.license_plate = vehicle.license_plate
        formValue.make = vehicle.make ?? ''
        formValue.model = vehicle.model
        formValue.year = vehicle.year
        formValue.vin = vehicle.vin ?? ''
        formValue.notes = vehicle.notes ?? ''
      }
    } finally {
      loading.value = false
    }
  }
})

function handleCancel(): void {
  void router.push({ name: 'VehicleList' })
}

function handleEdit(): void {
  if (vehicleId.value !== null) {
    void router.push({ name: 'VehicleEdit', params: { id: String(vehicleId.value) } })
  }
}

async function handleSave(): Promise<void> {
  await formRef.value?.validate()
  const payload = makePayload()
  try {
    if (isEdit.value && vehicleId.value !== null) {
      await vehicleStore.update(vehicleId.value, payload as VehicleUpdate)
    } else {
      await vehicleStore.create(payload as VehicleCreate)
    }
    void router.push({ name: 'VehicleList' })
  } catch {
    window.alert(t('app.error'))
  }
}

function makePayload(): VehicleCreate {
  return {
    customer_id: formValue.customer_id,
    license_plate: formValue.license_plate.toUpperCase(),
    make: formValue.make || null,
    model: formValue.model,
    year: formValue.year ?? null,
    vin: formValue.vin || null,
    notes: formValue.notes || null
  }
}
</script>

<style scoped>
.vehicle-form {
  max-width: 800px;
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
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.year-input {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style>
