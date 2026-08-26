<template>
  <div class="industrial-card" :class="{ 'industrial-card--no-border': noBorder }">
    <div v-if="showHeader" class="industrial-card__header">
      <div class="industrial-card__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="slots['header-actions']" class="industrial-card__actions">
        <slot name="header-actions" />
      </div>
    </div>
    <div class="industrial-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Props {
  title?: string
  noBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  noBorder: false
})

const slots = useSlots()

const showHeader = computed(() => Boolean(props.title || slots.title || slots['header-actions']))
</script>

<style scoped>
.industrial-card {
  background-color: var(--bi-surface-container);
  border: var(--bi-border-thin);
  border-radius: var(--bi-radius-lg);
  overflow: hidden;
}

.industrial-card--no-border {
  border: none;
}

.industrial-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--bi-space-2);
  padding: var(--bi-space-2) var(--bi-space-3);
  border-bottom: 1px solid var(--bi-outline-variant);
  background-color: var(--bi-surface-container-low);
}

.industrial-card__title {
  font: var(--bi-label-bold);
  letter-spacing: var(--bi-label-bold-letter-spacing);
  text-transform: uppercase;
  color: var(--bi-on-surface);
}

.industrial-card__actions {
  display: flex;
  align-items: center;
  gap: var(--bi-space-1);
}

.industrial-card__body {
  padding: var(--bi-space-3);
}
</style>
