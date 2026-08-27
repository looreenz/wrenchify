import { computed, onMounted, onUnmounted, ref } from 'vue'
import type {
  DownloadProgress,
  UpdateInfo,
  UpdateStatus,
  UpdaterStatus
} from '../../shared/types'

const status = ref<UpdateStatus>('not-available')
const updateInfo = ref<UpdateInfo | null>(null)
const downloadProgress = ref<DownloadProgress | null>(null)
const error = ref<string | null>(null)

let unsubscribeFns: Array<() => void> = []

function getUpdaterAPI() {
  return window.wrenchifyAPI?.updater
}

export function useAutoUpdater() {
  const updaterAPI = getUpdaterAPI()

  const isUpdateAvailable = computed(
    () => status.value === 'available' || status.value === 'downloaded'
  )
  const isDownloaded = computed(() => status.value === 'downloaded')
  const isDownloading = computed(() => status.value === 'downloading')

  function applyStatus(result: UpdaterStatus): void {
    status.value = result.status
    updateInfo.value = result.info
    downloadProgress.value = result.progress
    error.value = result.error
  }

  async function checkForUpdates(): Promise<void> {
    if (!updaterAPI) return
    const result = await updaterAPI.checkForUpdates()
    applyStatus(result)
  }

  async function downloadUpdate(): Promise<void> {
    if (!updaterAPI) return
    await updaterAPI.downloadUpdate()
  }

  function installUpdate(): void {
    if (!updaterAPI) return
    updaterAPI.quitAndInstall()
  }

  onMounted(() => {
    if (!updaterAPI) return

    unsubscribeFns.push(
      updaterAPI.onUpdateAvailable((info) => {
        status.value = 'available'
        updateInfo.value = info
        error.value = null
      }),
      updaterAPI.onUpdateDownloaded((info) => {
        status.value = 'downloaded'
        updateInfo.value = info
        downloadProgress.value = null
        error.value = null
      }),
      updaterAPI.onDownloadProgress((progress) => {
        status.value = 'downloading'
        downloadProgress.value = progress
        error.value = null
      }),
      updaterAPI.onUpdateError((message) => {
        status.value = 'error'
        error.value = message
      })
    )
  })

  onUnmounted(() => {
    unsubscribeFns.forEach((unsubscribe) => unsubscribe())
    unsubscribeFns = []
  })

  return {
    status,
    updateInfo,
    downloadProgress,
    error,
    isUpdateAvailable,
    isDownloaded,
    isDownloading,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  }
}
