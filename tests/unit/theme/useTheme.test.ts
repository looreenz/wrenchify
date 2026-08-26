import { describe, it, expect } from 'vitest'
import { darkTheme } from 'naive-ui'
import { useTheme } from '../../../src/renderer/composables/useTheme'

describe('useTheme', () => {
  it('returns the Naive UI dark theme', () => {
    const { theme } = useTheme()
    expect(theme).toBe(darkTheme)
    expect(theme.name).toBe('dark')
  })

  it('returns Beta Industrial overrides with the expected token mappings', () => {
    const { themeOverrides } = useTheme()

    expect(themeOverrides.common).toBeDefined()
    expect(themeOverrides.common?.primaryColor).toBe('var(--bi-primary-container)')
    expect(themeOverrides.common?.bodyColor).toBe('var(--bi-surface)')
    expect(themeOverrides.common?.cardColor).toBe('var(--bi-surface-container)')
    expect(themeOverrides.common?.fontFamily).toBe('var(--bi-font-sans)')
    expect(themeOverrides.common?.heightMedium).toBe('var(--bi-touch-target)')
  })

  it('returns component-specific overrides for Button, DataTable, Input and Menu', () => {
    const { themeOverrides } = useTheme()

    expect(themeOverrides.Button).toBeDefined()
    expect(themeOverrides.DataTable).toBeDefined()
    expect(themeOverrides.Input).toBeDefined()
    expect(themeOverrides.Menu).toBeDefined()

    expect(themeOverrides.Button?.fontWeightStrong).toBe('700')
    expect(themeOverrides.DataTable?.thColor).toBe('var(--bi-surface-container-high)')
    expect(themeOverrides.Input?.borderFocus).toBe('var(--bi-primary-container)')
    expect(themeOverrides.Menu?.itemTextColorActive).toBe('var(--bi-primary-container)')
  })
})
