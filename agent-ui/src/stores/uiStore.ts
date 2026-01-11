import { create } from 'zustand'

interface UIState {
  // Panels
  logPanelOpen: boolean
  settingsOpen: boolean

  // Sidebar
  sidebarWidth: number

  // Log panel
  logPanelWidth: number

  // Actions
  toggleLogPanel: () => void
  setLogPanelOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  setLogPanelWidth: (width: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  logPanelOpen: true,
  settingsOpen: false,
  sidebarWidth: 200,
  logPanelWidth: 350,

  toggleLogPanel: () => set((state) => ({ logPanelOpen: !state.logPanelOpen })),
  setLogPanelOpen: (logPanelOpen) => set({ logPanelOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setLogPanelWidth: (logPanelWidth) => set({ logPanelWidth })
}))
