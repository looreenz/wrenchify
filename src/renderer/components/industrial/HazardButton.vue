<template>
  <button
    type="button"
    class="hazard-button"
    :class="{
      'hazard-button--small': size === 'small',
      'hazard-button--medium': size === 'medium',
      'hazard-button--large': size === 'large',
      'hazard-button--disabled': disabled
    }"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
type ButtonSize = 'small' | 'medium' | 'large'

interface Props {
  size?: ButtonSize
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

function handleClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<style scoped>
.hazard-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--bi-space-1);
  border: 2px solid #ef4444;
  border-radius: var(--bi-radius);
  font: var(--bi-label-bold);
  letter-spacing: var(--bi-label-bold-letter-spacing);
  text-transform: uppercase;
  color: #ef4444;
  background-color: transparent;
  cursor: pointer;
  transition: background-image 0.2s ease, transform 0.1s ease;
}

.hazard-button:hover:not(:disabled) {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(253, 224, 71, 0.15) 0,
    rgba(253, 224, 71, 0.15) 8px,
    rgba(15, 23, 42, 0.15) 8px,
    rgba(15, 23, 42, 0.15) 16px
  );
  border-color: #ef4444;
  color: #ef4444;
}

.hazard-button:active:not(:disabled) {
  transform: translateY(1px);
}

.hazard-button--small {
  min-height: 28px;
  padding: 0 var(--bi-space-1);
  font-size: 12px;
}

.hazard-button--medium {
  min-height: var(--bi-touch-target);
  padding: 0 var(--bi-space-2);
  font-size: 14px;
}

.hazard-button--large {
  min-height: 56px;
  padding: 0 var(--bi-space-3);
  font-size: 16px;
}

.hazard-button:disabled,
.hazard-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
