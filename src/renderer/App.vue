<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider } from 'naive-ui'
import { useTheme } from './composables/useTheme'
import './styles/theme.css'

const { theme, themeOverrides } = useTheme()
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
</style>
