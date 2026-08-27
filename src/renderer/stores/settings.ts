import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { setLocale, type SupportedLocale } from '../../i18n'
import type { SettingKey, SettingsMap } from '../../shared/types'

const DEFAULT_SETTINGS: SettingsMap = {
  hourly_rate: 45,
  default_language: 'it',
  shop_name: 'Wrenchify',
  currency: 'EUR',
  vat_rate: 0.21
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<SettingsMap>({ ...DEFAULT_SETTINGS })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hourlyRate = computed(() => settings.value.hourly_rate)
  const defaultLanguage = computed(() => settings.value.default_language)
  const vatRate = computed(() => settings.value.vat_rate)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const loaded = await window.wrenchifyAPI.settings.getAll()
      settings.value = { ...DEFAULT_SETTINGS, ...loaded }
      setLocale(settings.value.default_language as SupportedLocale)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function update(key: SettingKey, value: string): Promise<void> {
    await window.wrenchifyAPI.settings.update(key, value)
    if (key === 'default_language') {
      setLocale(value as SupportedLocale)
    }
    await load()
  }

  function getSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] {
    return settings.value[key]
  }

  return {
    settings,
    loading,
    error,
    hourlyRate,
    defaultLanguage,
    vatRate,
    load,
    update,
    getSetting
  }
})
