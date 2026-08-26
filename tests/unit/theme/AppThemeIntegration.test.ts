// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { darkTheme, NConfigProvider } from 'naive-ui'
import App from '../../../src/renderer/App.vue'
import { i18n } from '../../../src/i18n'

describe('App theme integration', () => {
  it('wraps the router view in n-config-provider with dark theme and Beta Industrial overrides', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>home</div>' } }]
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), i18n, router]
      }
    })

    const provider = wrapper.findComponent(NConfigProvider)
    expect(provider.exists()).toBe(true)
    expect(provider.props('theme')).toBe(darkTheme)

    const overrides = provider.props('themeOverrides')
    expect(overrides.common.primaryColor).toBe('var(--bi-primary-container)')
    expect(overrides.common.bodyColor).toBe('var(--bi-surface)')
    expect(overrides.Input.borderFocus).toBe('var(--bi-primary-container)')
  })
})
