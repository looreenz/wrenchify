import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateInfo as ElectronUpdateInfo, ProgressInfo } from 'electron-updater'
import type {
  DownloadProgress,
  UpdateInfo,
  UpdateStatus,
  UpdaterStatus
} from '../shared/types'

const isDev = process.env.NODE_ENV === 'development'

const STARTUP_DELAY_MS = 5000
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours

let mainWindow: BrowserWindow | null = null
let currentStatus: UpdateStatus = 'not-available'
let currentUpdateInfo: UpdateInfo | null = null
let currentDownloadProgress: DownloadProgress | null = null
let currentError: string | null = null

function normalizeUpdateInfo(info: ElectronUpdateInfo): UpdateInfo {
  const releaseNotes =
    typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((note) => note.note).join('\n')
        : undefined

  return {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes
  }
}

function normalizeProgress(progress: ProgressInfo): DownloadProgress {
  return {
    percent: progress.percent,
    bytesPerSecond: progress.bytesPerSecond,
    total: progress.total,
    transferred: progress.transferred
  }
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function setStatus(status: UpdateStatus): void {
  currentStatus = status
  sendToRenderer('updater:statusChanged', status)
}

export function getStatus(): UpdateStatus {
  return currentStatus
}

export function getUpdateInfo(): UpdateInfo | null {
  return currentUpdateInfo
}

export function getDownloadProgress(): DownloadProgress | null {
  return currentDownloadProgress
}

export function getError(): string | null {
  return currentError
}

export function getUpdaterStatus(): UpdaterStatus {
  return {
    status: currentStatus,
    info: currentUpdateInfo,
    progress: currentDownloadProgress,
    error: currentError
  }
}

export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  if (isDev) {
    console.log('[autoUpdater] Disabled in development')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    currentStatus = 'checking'
    currentError = null
    sendToRenderer('updater:statusChanged', 'checking')
  })

  autoUpdater.on('update-available', (info) => {
    currentStatus = 'available'
    currentUpdateInfo = normalizeUpdateInfo(info)
    currentError = null
    sendToRenderer('updater:updateAvailable', currentUpdateInfo)
  })

  autoUpdater.on('update-not-available', (info) => {
    currentStatus = 'not-available'
    currentUpdateInfo = normalizeUpdateInfo(info)
    currentDownloadProgress = null
    currentError = null
    sendToRenderer('updater:statusChanged', 'not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    currentStatus = 'downloading'
    currentDownloadProgress = normalizeProgress(progress)
    sendToRenderer('updater:downloadProgress', currentDownloadProgress)
  })

  autoUpdater.on('update-downloaded', (info) => {
    currentStatus = 'downloaded'
    currentUpdateInfo = normalizeUpdateInfo(info)
    currentDownloadProgress = null
    currentError = null
    sendToRenderer('updater:updateDownloaded', currentUpdateInfo)
  })

  autoUpdater.on('error', (error) => {
    currentStatus = 'error'
    currentError = error.message
    sendToRenderer('updater:error', error.message)
  })

  setTimeout(() => {
    checkForUpdates().catch(() => {})
  }, STARTUP_DELAY_MS)

  setInterval(() => {
    checkForUpdates().catch(() => {})
  }, CHECK_INTERVAL_MS)
}

export async function checkForUpdates(): Promise<void> {
  if (isDev) {
    return
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    // autoUpdater emits the 'error' event internally; we only log to avoid an unhandled rejection.
    console.error('[autoUpdater] Failed to check for updates:', error)
  }
}

export async function downloadUpdate(): Promise<void> {
  if (isDev) {
    return
  }

  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    console.error('[autoUpdater] Failed to download update:', error)
    throw error
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}
