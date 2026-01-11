import { contextBridge, ipcRenderer } from 'electron'

// Types for database records
interface ClientRecord {
  id: string
  name: string | null
  last_session_id: string | null
  last_active: string | null
  metadata: string | null
  created_at: string
}

interface MessageRecord {
  id: string
  client_id: string
  type: 'user' | 'ai' | 'system'
  content: string
  data: string | null
  status: string | null
  created_at: string
}

interface TemplateRecord {
  id: string
  name: string
  content: string
  description: string | null
  category: string
  usage_count: number
  created_at: string
  updated_at: string
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: Electron.IpcRendererEvent, isMaximized: boolean) => callback(isMaximized)
    ipcRenderer.on('window:maximized', handler)
    return () => ipcRenderer.removeListener('window:maximized', handler)
  },

  // Settings (to be implemented)
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('settings:set', settings),

  // Database - Clients
  db: {
    getClients: (): Promise<ClientRecord[]> => ipcRenderer.invoke('db:getClients'),
    getClient: (id: string): Promise<ClientRecord | undefined> =>
      ipcRenderer.invoke('db:getClient', id),
    upsertClient: (client: Partial<ClientRecord> & { id: string }): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:upsertClient', client),
    deleteClient: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:deleteClient', id),

    // Messages
    getMessages: (
      clientId: string,
      options?: { limit?: number; offset?: number; before?: string }
    ): Promise<MessageRecord[]> => ipcRenderer.invoke('db:getMessages', clientId, options),
    getMessage: (id: string): Promise<MessageRecord | undefined> =>
      ipcRenderer.invoke('db:getMessage', id),
    insertMessage: (
      message: Omit<MessageRecord, 'created_at'>
    ): Promise<{ success: boolean }> => ipcRenderer.invoke('db:insertMessage', message),
    updateMessageStatus: (
      id: string,
      status: string,
      data?: string
    ): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:updateMessageStatus', id, status, data),
    deleteMessages: (clientId: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:deleteMessages', clientId),
    deleteAllMessages: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:deleteAllMessages'),

    // Templates
    getTemplates: (options?: { category?: string; limit?: number }): Promise<TemplateRecord[]> =>
      ipcRenderer.invoke('db:getTemplates', options),
    getTemplate: (id: string): Promise<TemplateRecord | undefined> =>
      ipcRenderer.invoke('db:getTemplate', id),
    insertTemplate: (
      template: Omit<TemplateRecord, 'usage_count' | 'created_at' | 'updated_at'>
    ): Promise<{ success: boolean }> => ipcRenderer.invoke('db:insertTemplate', template),
    updateTemplate: (
      id: string,
      updates: Partial<Omit<TemplateRecord, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
    ): Promise<{ success: boolean }> => ipcRenderer.invoke('db:updateTemplate', id, updates),
    deleteTemplate: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:deleteTemplate', id),
    incrementTemplateUsage: (id: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('db:incrementTemplateUsage', id),
    getTemplateCategories: (): Promise<string[]> =>
      ipcRenderer.invoke('db:getTemplateCategories')
  },

  // Notifications
  notification: {
    show: (title: string, body: string, options?: { sound?: boolean }) =>
      ipcRenderer.send('notification:show', title, body, options),
    isSupported: (): Promise<boolean> => ipcRenderer.invoke('notification:isSupported')
  },

  // File operations
  file: {
    saveDialog: (options: {
      title?: string
      defaultPath?: string
      filters?: { name: string; extensions: string[] }[]
    }): Promise<{ canceled: boolean; filePath?: string }> =>
      ipcRenderer.invoke('file:saveDialog', options),
    save: (
      filePath: string,
      content: string
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('file:save', filePath, content)
  },

  // Updater
  updater: {
    check: (): Promise<{ updateAvailable: boolean; version?: string }> =>
      ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.send('updater:download'),
    install: () => ipcRenderer.send('updater:install'),
    onStatus: (
      callback: (status: {
        status: string
        info?: unknown
        progress?: number
        error?: string
      }) => void
    ) => {
      const handler = (_: Electron.IpcRendererEvent, status: unknown) =>
        callback(status as { status: string; info?: unknown; progress?: number; error?: string })
      ipcRenderer.on('updater:status', handler)
      return () => ipcRenderer.removeListener('updater:status', handler)
    }
  },

  // Platform info
  platform: process.platform
})

// Type definitions for the exposed API
export interface DatabaseAPI {
  getClients: () => Promise<ClientRecord[]>
  getClient: (id: string) => Promise<ClientRecord | undefined>
  upsertClient: (client: Partial<ClientRecord> & { id: string }) => Promise<{ success: boolean }>
  deleteClient: (id: string) => Promise<{ success: boolean }>
  getMessages: (
    clientId: string,
    options?: { limit?: number; offset?: number; before?: string }
  ) => Promise<MessageRecord[]>
  getMessage: (id: string) => Promise<MessageRecord | undefined>
  insertMessage: (message: Omit<MessageRecord, 'created_at'>) => Promise<{ success: boolean }>
  updateMessageStatus: (id: string, status: string, data?: string) => Promise<{ success: boolean }>
  deleteMessages: (clientId: string) => Promise<{ success: boolean }>
  deleteAllMessages: () => Promise<{ success: boolean }>
  // Templates
  getTemplates: (options?: { category?: string; limit?: number }) => Promise<TemplateRecord[]>
  getTemplate: (id: string) => Promise<TemplateRecord | undefined>
  insertTemplate: (
    template: Omit<TemplateRecord, 'usage_count' | 'created_at' | 'updated_at'>
  ) => Promise<{ success: boolean }>
  updateTemplate: (
    id: string,
    updates: Partial<Omit<TemplateRecord, 'id' | 'created_at' | 'updated_at' | 'usage_count'>>
  ) => Promise<{ success: boolean }>
  deleteTemplate: (id: string) => Promise<{ success: boolean }>
  incrementTemplateUsage: (id: string) => Promise<{ success: boolean }>
  getTemplateCategories: () => Promise<string[]>
}

export interface FileAPI {
  saveDialog: (options: {
    title?: string
    defaultPath?: string
    filters?: { name: string; extensions: string[] }[]
  }) => Promise<{ canceled: boolean; filePath?: string }>
  save: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
}

export interface NotificationAPI {
  show: (title: string, body: string, options?: { sound?: boolean }) => void
  isSupported: () => Promise<boolean>
}

export interface UpdaterAPI {
  check: () => Promise<{ updateAvailable: boolean; version?: string }>
  download: () => void
  install: () => void
  onStatus: (
    callback: (status: {
      status: string
      info?: unknown
      progress?: number
      error?: string
    }) => void
  ) => () => void
}

export interface ElectronAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
  getSettings: () => Promise<unknown>
  setSettings: (settings: unknown) => Promise<void>
  db: DatabaseAPI
  file: FileAPI
  notification: NotificationAPI
  updater: UpdaterAPI
  platform: NodeJS.Platform
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
