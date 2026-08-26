import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initializeDatabase } from '../db/connection'
import { registerAllHandlers } from './ipc/handlers'
import { isRestoring, runAutoBackup } from './backup'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'Wrenchify',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

app.whenReady().then(async () => {
  try {
    await initializeDatabase()
    registerAllHandlers()
    console.log('[main] Database initialized')
  } catch (error) {
    console.error('[main] Failed to initialize database:', error)
  }

  createWindow()
})

app.on('before-quit', () => {
  if (isRestoring()) {
    return
  }

  try {
    const backupPath = runAutoBackup()
    console.log('[main] Auto-backup created:', backupPath)
  } catch (error) {
    console.error('[main] Auto-backup failed:', error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
