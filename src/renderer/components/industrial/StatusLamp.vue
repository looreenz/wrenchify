<template>
  <span
    class="status-lamp"
    :class="{
      'status-lamp--sm': size === 'sm',
      'status-lamp--md': size === 'md',
      'status-lamp--lg': size === 'lg',
      'status-lamp--pulse': pulse
    }"
    :style="cssVariables"
  >
    <span class="status-lamp__indicator" aria-hidden="true" />
    <span v-if="label" class="status-lamp__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type LampSize = 'sm' | 'md' | 'lg'

interface Props {
  color: string
  size?: LampSize
  label?: string
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: undefined,
  pulse: false
})

const cssVariables = computed(() => ({
  '--status-lamp-color': props.color
}))
</script>

<style scoped>
.status-lamp {
  display: inline-flex;
  align-items: center;
  gap: var(--bi-space-1);
}

.status-lamp__indicator {
  display: inline-block;
  flex-shrink: 0;
  border-radius: 50%;
  background-color: var(--status-lamp-color);
  box-shadow: 0 0 6px 1px var(--status-lamp-color);
}

.status-lamp--sm .status-lamp__indicator {
  width: 8px;
  height: 8px;
}

.status-lamp--md .status-lamp__indicator {
  width: 12px;
  height: 12px;
}

.status-lamp--lg .status-lamp__indicator {
  width: 16px;
  height: 16px;
}

.status-lamp--pulse .status-lamp__indicator {
  animation: status-lamp-pulse 1.6s ease-in-out infinite;
}

.status-lamp__label {
  font: var(--bi-body-md);
  color: var(--bi-on-surface);
}

@keyframes status-lamp-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 6px 1px var(--status-lamp-color);
  }

  50% {
    opacity: 0.6;
    box-shadow: 0 0 12px 3px var(--status-lamp-color);
  }
}
</style>
