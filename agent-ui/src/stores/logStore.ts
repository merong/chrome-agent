import { create } from 'zustand'
import type { LogEntry, LogFilter, MessageType, LogLevel } from '@/types'

interface LogState {
  entries: LogEntry[]
  filter: LogFilter
  isPaused: boolean
  selectedLogId: string | null
  maxEntries: number

  // Actions
  addLog: (entry: Omit<LogEntry, 'id'>) => void
  clearLogs: () => void
  setFilter: (filter: Partial<LogFilter>) => void
  resetFilter: () => void
  togglePause: () => void
  selectLog: (logId: string | null) => void
  setMaxEntries: (max: number) => void

  // Computed
  getFilteredEntries: () => LogEntry[]
}

const DEFAULT_FILTER: LogFilter = {
  types: undefined,
  clientIds: undefined,
  direction: 'all',
  level: undefined,
  search: undefined,
  timeRange: undefined
}

const DEFAULT_MAX_ENTRIES = 1000

let logIdCounter = 0

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],
  filter: DEFAULT_FILTER,
  isPaused: false,
  selectedLogId: null,
  maxEntries: DEFAULT_MAX_ENTRIES,

  addLog: (entry) => {
    if (get().isPaused) return

    const newEntry: LogEntry = {
      ...entry,
      id: `log-${++logIdCounter}-${Date.now()}`
    }

    set((state) => {
      let newEntries = [...state.entries, newEntry]

      // Trim to max entries
      if (newEntries.length > state.maxEntries) {
        newEntries = newEntries.slice(-state.maxEntries)
      }

      return { entries: newEntries }
    })
  },

  clearLogs: () => set({ entries: [], selectedLogId: null }),

  setFilter: (filterUpdate) =>
    set((state) => ({
      filter: { ...state.filter, ...filterUpdate }
    })),

  resetFilter: () => set({ filter: DEFAULT_FILTER }),

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  selectLog: (logId) => set({ selectedLogId: logId }),

  setMaxEntries: (maxEntries) => set({ maxEntries }),

  getFilteredEntries: () => {
    const { entries, filter } = get()

    return entries.filter((entry) => {
      // Filter by type
      if (filter.types && filter.types.length > 0) {
        if (!filter.types.includes(entry.type)) return false
      }

      // Filter by direction
      if (filter.direction && filter.direction !== 'all') {
        if (entry.direction !== filter.direction) return false
      }

      // Filter by client
      if (filter.clientIds && filter.clientIds.length > 0) {
        if (!entry.clientId || !filter.clientIds.includes(entry.clientId))
          return false
      }

      // Filter by level
      if (filter.level && filter.level.length > 0) {
        if (!filter.level.includes(entry.level)) return false
      }

      // Filter by search
      if (filter.search && filter.search.trim()) {
        const searchLower = filter.search.toLowerCase()
        const matchesSummary = entry.summary.toLowerCase().includes(searchLower)
        const matchesType = entry.type.toLowerCase().includes(searchLower)
        const matchesClient = entry.clientName
          ?.toLowerCase()
          .includes(searchLower)
        if (!matchesSummary && !matchesType && !matchesClient) return false
      }

      // Filter by time range
      if (filter.timeRange) {
        const entryTime = entry.timestamp.getTime()
        if (
          entryTime < filter.timeRange.start.getTime() ||
          entryTime > filter.timeRange.end.getTime()
        ) {
          return false
        }
      }

      return true
    })
  }
}))
