import pkg from 'electron-updater'
const { autoUpdater } = pkg
import type { UpdateCheckResult, UpdateInfo } from 'electron-updater'
import { BrowserWindow, ipcMain, dialog } from 'electron'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

export interface UpdateStatus {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error'
  info?: UpdateInfo
  progress?: number
  error?: string
}

// Initialize auto updater
export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  // Configure auto updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Don't check for updates in development
  if (is.dev) {
    console.log('Auto-updater disabled in development mode')
    return
  }

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow({ status: 'checking' })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendStatusToWindow({ status: 'available', info })

    // Show dialog to user
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. Would you like to download it now?`,
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  })

  autoUpdater.on('update-not-available', () => {
    sendStatusToWindow({ status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow({
      status: 'downloading',
      progress: progressObj.percent
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendStatusToWindow({ status: 'downloaded', info })

    // Show dialog to user
    dialog
      .showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message:
          'A new version has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on('error', (error) => {
    sendStatusToWindow({
      status: 'error',
      error: error.message
    })
  })

  // Register IPC handlers
  registerIpcHandlers()

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    checkForUpdates()
  }, 3000)
}

// Send status to renderer
function sendStatusToWindow(status: UpdateStatus): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', status)
  }
}

// Check for updates
export async function checkForUpdates(): Promise<UpdateCheckResult | null> {
  if (is.dev) {
    console.log('Skipping update check in development')
    return null
  }

  try {
    return await autoUpdater.checkForUpdates()
  } catch (error) {
    console.error('Error checking for updates:', error)
    return null
  }
}

// Download update
export function downloadUpdate(): void {
  autoUpdater.downloadUpdate()
}

// Quit and install
export function quitAndInstall(): void {
  autoUpdater.quitAndInstall()
}

// Register IPC handlers
function registerIpcHandlers(): void {
  ipcMain.handle('updater:check', async () => {
    const result = await checkForUpdates()
    return result
      ? { updateAvailable: true, version: result.updateInfo.version }
      : { updateAvailable: false }
  })

  ipcMain.on('updater:download', () => {
    downloadUpdate()
  })

  ipcMain.on('updater:install', () => {
    quitAndInstall()
  })
}
