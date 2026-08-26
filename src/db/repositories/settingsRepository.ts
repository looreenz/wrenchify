import type { SettingKey, SettingsMap } from '../../shared/types'
import { getDatabase } from '../connection'

const DEFAULT_SETTINGS: SettingsMap = {
  hourly_rate: 45,
  default_language: 'it',
  shop_name: 'Wrenchify',
  currency: 'EUR'
}

export function getAll(): SettingsMap {
  const db = getDatabase()

  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: SettingKey
    value: string
  }>

  const values: Partial<SettingsMap> = {}

  for (const row of rows) {
    switch (row.key) {
      case 'hourly_rate':
        values.hourly_rate = Number(row.value)
        break
      case 'default_language':
        values.default_language = row.value as 'it' | 'es'
        break
      case 'shop_name':
        values.shop_name = row.value
        break
      case 'currency':
        values.currency = row.value
        break
    }
  }

  return {
    hourly_rate: values.hourly_rate ?? DEFAULT_SETTINGS.hourly_rate,
    default_language: values.default_language ?? DEFAULT_SETTINGS.default_language,
    shop_name: values.shop_name ?? DEFAULT_SETTINGS.shop_name,
    currency: values.currency ?? DEFAULT_SETTINGS.currency
  }
}

export function getHourlyRate(): number {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'hourly_rate'").get() as
    | { value: string }
    | undefined
  return row ? Number(row.value) : DEFAULT_SETTINGS.hourly_rate
}

export function update(key: SettingKey, value: string): void {
  const db = getDatabase()

  if (key === 'hourly_rate') {
    const num = Number(value)
    if (Number.isNaN(num) || num < 0) {
      throw new Error('Hourly rate must be a non-negative number')
    }
  }

  if (key === 'default_language' && value !== 'it' && value !== 'es') {
    throw new Error('Default language must be it or es')
  }

  if (key === 'shop_name' && value.length > 100) {
    throw new Error('Shop name must be 100 characters or less')
  }

  const result = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?').run(key, value, value)

  if (result.changes === 0) {
    throw new Error(`Setting ${key} not updated`)
  }
}

export const settingsRepository = {
  getAll,
  getHourlyRate,
  update
}
