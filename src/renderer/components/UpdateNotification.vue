<template>
  <teleport to="body">
    <transition name="update-notification-fade">
      <div v-if="visible" class="update-notification">
        <n-alert
          :type="alertType"
          :title="title"
          closable
          @close="visible = false"
        >
          <div class="update-notification__content">
            <p v-if="updateInfo" class="update-notification__version">
              {{ t('update.version', { version: updateInfo.version }) }}
            </p>

            <n-progress
              v-if="isDownloading && downloadProgress"
              :percentage="Math.round(downloadProgress.percent)"
              :indicator-text="`${Math.round(downloadProgress.percent)}%`"
              type="line"
              status="success"
            />

            <div class="update-notification__actions">
              <n-button
                v-if="isDownloaded"
                type="primary"
                size="small"
                @click="installUpdate"
              >
                {{ t('update.restart') }}
              </n-button>
              <n-button
                v-else-if="isUpdateAvailable"
                type="primary"
                size="small"
                :loading="isDownloading"
                @click="downloadUpdate"
              >
                {{ t('update.download') }}
              </n-button>
            </div>

            <p v-if="error" class="update-notification__error">
              {{ error }}
            </p>
          </div>
        </n-alert>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NProgress } from 'naive-ui'
import { useAutoUpdater } from '../composables/useAutoUpdater'
import { useI18n } from 'vue-i18n'

const {
  status,
  updateInfo,
  downloadProgress,
  error,
  isUpdateAvailable,
  isDownloaded,
  isDownloading,
  downloadUpdate,
  installUpdate
} = useAutoUpdater()

const { t } = useI18n()

const visible = ref(false)

const title = computed(() => {
  if (isDownloaded.value) return t('update.ready')
  if (isDownloading.value) return t('update.downloading')
  if (isUpdateAvailable.value) return t('update.available')
  return t('update.title')
})

const alertType = computed(() => {
  if (error.value) return 'error'
  if (isDownloaded.value) return 'success'
  return 'info'
})

watch(
  () => status.value,
  (newStatus) => {
    visible.value =
      newStatus === 'available' ||
      newStatus === 'downloading' ||
      newStatus === 'downloaded' ||
      newStatus === 'error'
  },
  { immediate: true }
)
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  width: 360px;
  max-width: calc(100vw - 32px);
}

.update-notification__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.update-notification__version {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.update-notification__actions {
  display: flex;
  justify-content: flex-end;
}

.update-notification__error {
  margin: 0;
  font-size: 12px;
  color: #ff4d4f;
}

.update-notification-fade-enter-active,
.update-notification-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.update-notification-fade-enter-from,
.update-notification-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
