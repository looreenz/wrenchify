<template>
  <div class="customer-form">
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
          <n-form-item :label="$t('customer.firstName')" path="first_name">
            <n-input
              v-model:value="formValue.first_name"
              :disabled="isReadOnly"
              :placeholder="$t('customer.firstName')"
              :input-props="{ 'data-testid': 'customer-first-name' }"
            />
          </n-form-item>
          <n-form-item :label="$t('customer.lastName')" path="last_name">
            <n-input
              v-model:value="formValue.last_name"
              :disabled="isReadOnly"
              :placeholder="$t('customer.lastName')"
              :input-props="{ 'data-testid': 'customer-last-name' }"
            />
          </n-form-item>
        </div>

        <div class="form-row">
          <n-form-item :label="$t('customer.phone')" path="phone">
            <n-input
              v-model:value="formValue.phone"
              :disabled="isReadOnly"
              :placeholder="$t('customer.phone')"
            />
          </n-form-item>
          <n-form-item :label="$t('customer.email')" path="email">
            <n-input
              v-model:value="formValue.email"
              :disabled="isReadOnly"
              :placeholder="$t('customer.email')"
            />
          </n-form-item>
        </div>

        <n-form-item :label="$t('customer.address')" path="address">
          <n-input
            v-model:value="formValue.address"
            :disabled="isReadOnly"
            :placeholder="$t('customer.address')"
          />
        </n-form-item>

        <div class="form-row">
          <n-form-item :label="$t('customer.fiscalCode')" path="fiscal_code">
            <n-input
              v-model:value="formValue.fiscal_code"
              :disabled="isReadOnly"
              :placeholder="$t('customer.fiscalCode')"
            />
          </n-form-item>
          <n-form-item :label="$t('customer.preferredLanguage')" path="preferred_language">
            <n-select
              v-model:value="formValue.preferred_language"
              :disabled="isReadOnly"
              :options="languageOptions"
              :placeholder="$t('customer.preferredLanguage')"
            />
          </n-form-item>
        </div>

        <n-form-item :label="$t('customer.notes')" path="notes">
          <n-input
            v-model:value="formValue.notes"
            type="textarea"
            :disabled="isReadOnly"
            :placeholder="$t('customer.notes')"
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
  NSelect,
  NSpin
} from 'naive-ui'
import { useCustomerStore } from '../../stores/customers'
import type { CustomerCreate, CustomerUpdate, Language } from '../../../shared/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const customerStore = useCustomerStore()

const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const customerId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isReadOnly = computed(() => route.name === 'CustomerDetail')
const isEdit = computed(() => route.name === 'CustomerEdit')

const pageTitle = computed(() => {
  if (isReadOnly.value) return t('customer.detail')
  if (isEdit.value) return t('customer.edit')
  return t('customer.new')
})

const formValue = reactive<CustomerCreate>({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  address: '',
  fiscal_code: '',
  notes: '',
  preferred_language: 'it'
})

const languageOptions = computed(() => [
  { label: t('settings.languageIt'), value: 'it' },
  { label: t('settings.languageEs'), value: 'es' }
])

const rules: FormRules = {
  last_name: [
    { required: true, message: t('customer.validation.lastNameRequired'), trigger: ['blur', 'input'] }
  ],
  email: [
    {
      validator: (_rule, value: string | null) => {
        if (!value) return true
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      },
      message: t('customer.validation.emailInvalid'),
      trigger: ['blur', 'input']
    }
  ]
}

onMounted(async () => {
  if (customerId.value !== null) {
    loading.value = true
    try {
      const customer = await customerStore.getById(customerId.value)
      if (customer) {
        formValue.first_name = customer.first_name ?? ''
        formValue.last_name = customer.last_name
        formValue.phone = customer.phone ?? ''
        formValue.email = customer.email ?? ''
        formValue.address = customer.address ?? ''
        formValue.fiscal_code = customer.fiscal_code ?? ''
        formValue.notes = customer.notes ?? ''
        formValue.preferred_language = customer.preferred_language
      }
    } finally {
      loading.value = false
    }
  }
})

function handleCancel(): void {
  void router.push({ name: 'CustomerList' })
}

function handleEdit(): void {
  if (customerId.value !== null) {
    void router.push({ name: 'CustomerEdit', params: { id: String(customerId.value) } })
  }
}

async function handleSave(): Promise<void> {
  await formRef.value?.validate()
  const payload = makePayload()
  try {
    if (isEdit.value && customerId.value !== null) {
      await customerStore.update(customerId.value, payload as CustomerUpdate)
    } else {
      await customerStore.create(payload as CustomerCreate)
    }
    void router.push({ name: 'CustomerList' })
  } catch {
    window.alert(t('app.error'))
  }
}

function makePayload(): CustomerCreate {
  return {
    first_name: formValue.first_name || null,
    last_name: formValue.last_name,
    phone: formValue.phone || null,
    email: formValue.email || null,
    address: formValue.address || null,
    fiscal_code: formValue.fiscal_code || null,
    notes: formValue.notes || null,
    preferred_language: formValue.preferred_language as Language
  }
}
</script>

<style scoped>
.customer-form {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--bi-space-2);
}

.form-actions {
  display: flex;
  gap: var(--bi-space-2);
  margin-top: var(--bi-space-3);
}
</style>
