<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <router-view />
    <update-notification />
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useAutoUpdater } from './composables/useAutoUpdater'
import UpdateNotification from './components/UpdateNotification.vue'
import './styles/theme.css'

const { theme, themeOverrides } = useTheme()
const { checkForUpdates } = useAutoUpdater()

onMounted(() => {
  checkForUpdates()
})
</script>

<style>
body {
  margin: 0;
  font-family: var(--bi-font-sans);
  background-color: var(--bi-bg);
  color: var(--bi-text);
}

* {
  box-sizing: border-box;
}

/* Override Naive UI error buttons with intense red */
.n-button--error-type {
  --n-text-color: #ef4444 !important;
  --n-border: 1px solid #ef4444 !important;
  --n-border-hover: 1px solid #ef4444 !important;
  --n-border-pressed: 1px solid #ef4444 !important;
  --n-border-focus: 1px solid #ef4444 !important;
  --n-color-hover: rgba(239, 68, 68, 0.08) !important;
  --n-color-pressed: rgba(239, 68, 68, 0.12) !important;
}
</style>
