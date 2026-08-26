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
    expect(themeOverrides.common?.primaryColor).toBe('#ff6b00')
    expect(themeOverrides.common?.bodyColor).toBe('#0b1326')
    expect(themeOverrides.common?.cardColor).toBe('#171f33')
    expect(themeOverrides.common?.fontFamily).toBe("system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif")
    expect(themeOverrides.common?.heightMedium).toBe('52px')
  })

  it('returns component-specific overrides for Button, DataTable, Input and Menu', () => {
    const { themeOverrides } = useTheme()

    expect(themeOverrides.Button).toBeDefined()
    expect(themeOverrides.DataTable).toBeDefined()
    expect(themeOverrides.Input).toBeDefined()
    expect(themeOverrides.Menu).toBeDefined()

    expect(themeOverrides.Button?.fontWeightStrong).toBe('700')
    expect(themeOverrides.DataTable?.thColor).toBe('#222a3d')
    expect(themeOverrides.Input?.borderFocus).toBe('#ff6b00')
    expect(themeOverrides.Menu?.itemTextColorActive).toBe('#ff6b00')
  })
})
