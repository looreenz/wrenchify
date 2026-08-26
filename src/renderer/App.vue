<template>
  <div class="app-shell">
    <h1>{{ $t('app.title') }}</h1>
    <p>{{ $t('app.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
// Root component placeholder. Router and layout will be wired in Batch 3.
</script>

<style>
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #1a1a1a;
}

.app-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
