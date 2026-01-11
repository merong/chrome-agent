import { create } from 'zustand'
import type { AppSettings } from '@/types'

const DEFAULT_SETTINGS: AppSettings = {
  server: {
    url: 'ws://localhost:8080/ws',
    autoConnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 5,
    heartbeatInterval: 10
  },
  ui: {
    theme: 'system',
    language: 'ko',
    fontSize: 14,
    sidebarPosition: 'left'
  },
  notifications: {
    desktop: true,
    sound: false,
    connectionStatus: true,
    commandComplete: true
  },
  desktop: {
    systemTray: true,
    startMinimized: false,
    autoStart: false
  },
  shortcuts: {
    sendMessage: 'Ctrl+Enter',
    newConversation: 'Ctrl+N',
    openSettings: 'Ctrl+,',
    toggleLogPanel: 'Ctrl+L'
  }
}

interface SettingsState {
  settings: AppSettings
  isLoading: boolean

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void
  updateServerSettings: (updates: Partial<AppSettings['server']>) => void
  updateUISettings: (updates: Partial<AppSettings['ui']>) => void
  updateNotificationSettings: (
    updates: Partial<AppSettings['notifications']>
  ) => void
  updateDesktopSettings: (updates: Partial<AppSettings['desktop']>) => void
  updateShortcutSettings: (updates: Partial<AppSettings['shortcuts']>) => void
  resetToDefaults: () => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates }
    })),

  updateServerSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        server: { ...state.settings.server, ...updates }
      }
    })),

  updateUISettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ui: { ...state.settings.ui, ...updates }
      }
    })),

  updateNotificationSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: { ...state.settings.notifications, ...updates }
      }
    })),

  updateDesktopSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        desktop: { ...state.settings.desktop, ...updates }
      }
    })),

  updateShortcutSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        shortcuts: { ...state.settings.shortcuts, ...updates }
      }
    })),

  resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),

  loadSettings: async () => {
    set({ isLoading: true })
    try {
      const loaded = await window.electronAPI?.getSettings()
      if (loaded) {
        set({ settings: loaded as AppSettings })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  saveSettings: async () => {
    try {
      await window.electronAPI?.setSettings(get().settings)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
}))
