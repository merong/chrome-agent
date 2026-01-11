import { app, BrowserWindow, ipcMain, shell, dialog, Notification } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initAutoUpdater } from './services/updater'
import {
  initDatabase,
  closeDatabase,
  getClients,
  getClient,
  upsertClient,
  deleteClient,
  getMessages,
  getMessage,
  insertMessage,
  updateMessageStatus,
  deleteMessages,
  deleteAllMessages,
  getTemplates,
  getTemplate,
  insertTemplate,
  updateTemplate,
  deleteTemplate,
  incrementTemplateUsage,
  getTemplateCategories,
  type ClientRecord,
  type MessageRecord,
  type TemplateRecord
} from './services/database'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    frame: false, // Frameless for custom title bar
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 10 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Window control IPC handlers
ipcMain.on('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

// Database IPC handlers - Clients
ipcMain.handle('db:getClients', () => {
  return getClients()
})

ipcMain.handle('db:getClient', (_, id: string) => {
  return getClient(id)
})

ipcMain.handle('db:upsertClient', (_, client: Partial<ClientRecord> & { id: string }) => {
  upsertClient(client)
  return { success: true }
})

ipcMain.handle('db:deleteClient', (_, id: string) => {
  deleteClient(id)
  return { success: true }
})

// Database IPC handlers - Messages
ipcMain.handle(
  'db:getMessages',
  (_, clientId: string, options?: { limit?: number; offset?: number; before?: string }) => {
    return getMessages(clientId, options)
  }
)

ipcMain.handle('db:getMessage', (_, id: string) => {
  return getMessage(id)
})

ipcMain.handle('db:insertMessage', (_, message: Omit<MessageRecord, 'created_at'>) => {
  insertMessage(message)
  return { success: true }
})

ipcMain.handle('db:updateMessageStatus', (_, id: string, status: string, data?: string) => {
  updateMessageStatus(id, status, data)
  return { success: true }
})

ipcMain.handle('db:deleteMessages', (_, clientId: string) => {
  deleteMessages(clientId)
  return { success: true }
})

ipcMain.handle('db:deleteAllMessages', () => {
  deleteAllMessages()
  return { success: true }
})

// Database IPC handlers - Templates
ipcMain.handle('db:getTemplates', (_, options?: { category?: string; limit?: number }) => {
  return getTemplates(options)
})

ipcMain.handle('db:getTemplate', (_, id: string) => {
  return getTemplate(id)
})

ipcMain.handle(
  'db:insertTemplate',
  (_, template: Omit<TemplateRecord, 'usage_count' | 'created_at' | 'updated_at'>) => {
    insertTemplate(template)
    return { success: true }
  }
)

ipcMain.handle(
  'db:updateTemplate',
  (
    _,
    id: string,
    updates: Partial<Omit<TemplateRecord, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
  ) => {
    updateTemplate(id, updates)
    return { success: true }
  }
)

ipcMain.handle('db:deleteTemplate', (_, id: string) => {
  deleteTemplate(id)
  return { success: true }
})

ipcMain.handle('db:incrementTemplateUsage', (_, id: string) => {
  incrementTemplateUsage(id)
  return { success: true }
})

ipcMain.handle('db:getTemplateCategories', () => {
  return getTemplateCategories()
})

// File export IPC handlers
ipcMain.handle(
  'file:saveDialog',
  async (
    _,
    options: {
      title?: string
      defaultPath?: string
      filters?: { name: string; extensions: string[] }[]
    }
  ) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: options.title || 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
    })
    return result
  }
)

ipcMain.handle(
  'file:save',
  async (_, filePath: string, content: string) => {
    try {
      writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Failed to save file:', error)
      return { success: false, error: String(error) }
    }
  }
)

// Notification IPC handlers
ipcMain.on('notification:show', (_, title: string, body: string, options?: { sound?: boolean }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: options?.sound === false
    })

    notification.on('click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })

    notification.show()
  }
})

ipcMain.handle('notification:isSupported', () => {
  return Notification.isSupported()
})

// App lifecycle
app.whenReady().then(() => {
  // Initialize database
  initDatabase()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.chromeagent.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Initialize auto-updater after window is created
  if (mainWindow) {
    initAutoUpdater(mainWindow)
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up database on quit
app.on('will-quit', () => {
  closeDatabase()
})

// Handle maximize/unmaximize events for UI updates
app.on('browser-window-created', (_, window) => {
  window.on('maximize', () => {
    window.webContents.send('window:maximized', true)
  })
  window.on('unmaximize', () => {
    window.webContents.send('window:maximized', false)
  })
})
