<template>
  <div class="settings-view">
    <div class="page-header">
      <h1>{{ $t('settings.title') }}</h1>
    </div>

    <n-spin :show="settingsStore.loading">
      <n-form label-placement="top" class="form">
        <n-form-item :label="$t('settings.shopName')">
          <n-input
            v-model:value="form.shop_name"
            :maxlength="100"
            :placeholder="$t('settings.shopName')"
            @blur="saveShopName"
          />
        </n-form-item>

        <div class="form-row">
          <n-form-item :label="$t('settings.hourlyRate')">
            <n-input-number
              v-model:value="form.hourly_rate"
              :min="0"
              :precision="2"
              class="number-input"
              @update:value="onRateChange"
            />
          </n-form-item>

          <n-form-item :label="$t('settings.vatRate')" :feedback="vatFeedback" :validation-status="vatStatus">
            <n-input-number
              v-model:value="form.vat_rate"
              :min="0"
              :max="100"
              :precision="0"
              class="number-input"
              @update:value="onVatChange"
            >
              <template #suffix>%</template>
            </n-input-number>
          </n-form-item>
        </div>

        <n-form-item :label="$t('settings.defaultLanguage')">
          <n-select
            v-model:value="form.default_language"
            :options="languageOptions"
            :placeholder="$t('settings.defaultLanguage')"
            @update:value="saveLanguage"
          />
        </n-form-item>

        <n-form-item :label="$t('settings.currency')">
          <n-input v-model:value="form.currency" disabled />
        </n-form-item>
      </n-form>

      <n-alert v-if="backupMessage" :type="backupMessageType" class="backup-alert">
        {{ backupMessage }}
      </n-alert>

      <div class="backup-actions">
        <n-button @click="handleExport">
          {{ $t('settings.exportBackup') }}
        </n-button>
        <n-button @click="handleRestore">
          {{ $t('settings.restoreBackup') }}
        </n-button>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpin
} from 'naive-ui'
import { useSettingsStore } from '../../stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const form = reactive({
  hourly_rate: settingsStore.settings.hourly_rate,
  vat_rate: Math.round(settingsStore.settings.vat_rate * 100),
  default_language: settingsStore.settings.default_language,
  shop_name: settingsStore.settings.shop_name,
  currency: settingsStore.settings.currency
})

const languageOptions = [
  { label: t('settings.languageIt'), value: 'it' },
  { label: t('settings.languageEs'), value: 'es' }
]

const backupMessage = ref<string | null>(null)
const backupMessageType = ref<'success' | 'error'>('success')

const vatStatus = computed<"error" | undefined>(() => {
  const value = form.vat_rate
  return value === null || value < 0 || value > 100 ? 'error' : undefined
})

const vatFeedback = computed(() => {
  return vatStatus.value === 'error' ? t('settings.validation.vatRateRange') : undefined
})

onMounted(() => {
  void settingsStore.load()
})

watch(
  () => settingsStore.settings,
  (s) => {
    form.hourly_rate = s.hourly_rate
    form.vat_rate = Math.round(s.vat_rate * 100)
    form.default_language = s.default_language
    form.shop_name = s.shop_name
    form.currency = s.currency
  },
  { deep: true }
)

let rateTimeout: ReturnType<typeof setTimeout> | null = null

function onRateChange(value: number | null): void {
  if (rateTimeout) {
    clearTimeout(rateTimeout)
  }
  rateTimeout = setTimeout(() => {
    void settingsStore.update('hourly_rate', String(value ?? 0))
  }, 300)
}

let vatTimeout: ReturnType<typeof setTimeout> | null = null

function onVatChange(value: number | null): void {
  if (vatTimeout) {
    clearTimeout(vatTimeout)
  }
  vatTimeout = setTimeout(() => {
    const numeric = value ?? 0
    if (numeric < 0 || numeric > 100) return
    void settingsStore.update('vat_rate', String(numeric / 100))
  }, 300)
}

function saveShopName(): void {
  void settingsStore.update('shop_name', form.shop_name)
}

function saveLanguage(value: string): void {
  void settingsStore.update('default_language', value)
}

function showBackupMessage(message: string, type: 'success' | 'error'): void {
  backupMessage.value = message
  backupMessageType.value = type
  setTimeout(() => {
    backupMessage.value = null
  }, 4000)
}

async function handleExport(): Promise<void> {
  try {
    const result = await window.wrenchifyAPI.backup.exportManual()
    if (result.success && result.path) {
      showBackupMessage(t('settings.exportSuccess', { path: result.path }), 'success')
    } else if (result.error) {
      showBackupMessage(result.error, 'error')
    }
  } catch {
    showBackupMessage(t('app.error'), 'error')
  }
}

async function handleRestore(): Promise<void> {
  try {
    const result = await window.wrenchifyAPI.backup.restore()
    if (result.success) {
      showBackupMessage(t('settings.restoreSuccess'), 'success')
    } else if (result.error) {
      showBackupMessage(result.error, 'error')
    }
  } catch {
    showBackupMessage(t('app.error'), 'error')
  }
}
</script>

<style scoped>
.settings-view {
  max-width: 800px;
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

.number-input {
  width: 100%;
}

.backup-actions {
  display: flex;
  gap: var(--bi-space-2);
}

.backup-alert {
  margin-bottom: var(--bi-space-2);
}
</style>
