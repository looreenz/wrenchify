import { app, dialog } from 'electron'
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { closeDatabase, getDatabase, getDatabasePath } from '../db/connection'

const BACKUP_PREFIX = 'shop_data_'
const BACKUP_SUFFIX = '.sqlite'
const AUTO_BACKUP_LIMIT = 3

let restoring = false

export function isRestoring(): boolean {
  return restoring
}

function getBackupsDirectory(): string {
  return join(app.getPath('userData'), 'backups')
}

function ensureBackupsDirectory(): string {
  const dir = getBackupsDirectory()
  mkdirSync(dir, { recursive: true })
  return dir
}

function formatTimestamp(date: Date): string {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const HH = String(date.getHours()).padStart(2, '0')
  const MM = String(date.getMinutes()).padStart(2, '0')
  const SS = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}_${HH}-${MM}-${SS}`
}

function generateBackupFilename(): string {
  return `${BACKUP_PREFIX}${formatTimestamp(new Date())}${BACKUP_SUFFIX}`
}

function getAutoBackupFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.startsWith(BACKUP_PREFIX) && name.endsWith(BACKUP_SUFFIX))
    .map((name) => join(dir, name))
    .sort((a, b) => statSync(b).mtime.getTime() - statSync(a).mtime.getTime())
}

function rotateAutoBackups(dir: string): void {
  const files = getAutoBackupFiles(dir)
  const toDelete = files.slice(AUTO_BACKUP_LIMIT)
  for (const file of toDelete) {
    try {
      unlinkSync(file)
    } catch (error) {
      console.error(`[backup] Failed to delete old backup ${file}:`, error)
    }
  }
}

function checkpointDatabase(): void {
  const db = getDatabase()
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
}

export function runAutoBackup(): string {
  const dbPath = getDatabasePath()
  const dir = ensureBackupsDirectory()
  const destPath = join(dir, generateBackupFilename())

  checkpointDatabase()
  copyFileSync(dbPath, destPath)
  rotateAutoBackups(dir)

  console.log(`[backup] Created auto-backup: ${destPath}`)
  return destPath
}

export async function exportManualBackup(): Promise<{
  success: boolean
  path?: string
  error?: string
}> {
  const dbPath = getDatabasePath()
  const defaultPath = generateBackupFilename()

  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: [{ name: 'SQLite Database', extensions: ['sqlite'] }]
  })

  if (result.canceled || !result.filePath) {
    return { success: false }
  }

  try {
    checkpointDatabase()
    copyFileSync(dbPath, result.filePath)
    console.log(`[backup] Exported manual backup: ${result.filePath}`)
    return { success: true, path: result.filePath }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup] Manual export failed:', error)
    return { success: false, error: message }
  }
}

function validateSQLiteFile(filePath: string): boolean {
  try {
    const header = readFileSync(filePath).subarray(0, 16).toString('utf8')
    return header === 'SQLite format 3\u0000'
  } catch {
    return false
  }
}

export async function restoreFromBackup(): Promise<{
  success: boolean
  error?: string
}> {
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }],
    properties: ['openFile']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false }
  }

  const sourcePath = result.filePaths[0]

  if (!validateSQLiteFile(sourcePath)) {
    return { success: false, error: 'Selected file is not a valid SQLite database' }
  }

  const confirm = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Yes', 'No'],
    defaultId: 1,
    title: 'Restore Backup',
    message: 'Restore this backup? Current data will be replaced and the app will restart.'
  })

  if (confirm.response !== 0) {
    return { success: false }
  }

  try {
    restoring = true
    const dbPath = getDatabasePath()
    closeDatabase()
    copyFileSync(sourcePath, dbPath)
    app.relaunch()
    app.quit()
    return { success: true }
  } catch (error) {
    restoring = false
    const message = error instanceof Error ? error.message : String(error)
    console.error('[backup] Restore failed:', error)
    return { success: false, error: message }
  }
}
