import { create } from 'zustand'
import type { ConnectionStatus } from '@/types'

interface ConnectionState {
  status: ConnectionStatus
  serverUrl: string
  sessionId: string | null
  reconnectAttempts: number
  maxReconnectAttempts: number
  lastError: string | null
  latency: number | null

  // Actions
  setStatus: (status: ConnectionStatus) => void
  setServerUrl: (url: string) => void
  setSessionId: (sessionId: string | null) => void
  setLastError: (error: string | null) => void
  setLatency: (latency: number | null) => void
  incrementReconnectAttempts: () => void
  resetReconnectAttempts: () => void
  reset: () => void
}

const DEFAULT_SERVER_URL = 'ws://localhost:8080/ws'
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  serverUrl: DEFAULT_SERVER_URL,
  sessionId: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: DEFAULT_MAX_RECONNECT_ATTEMPTS,
  lastError: null,
  latency: null,

  setStatus: (status) => set({ status }),
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setSessionId: (sessionId) => set({ sessionId }),
  setLastError: (lastError) => set({ lastError }),
  setLatency: (latency) => set({ latency }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
  reset: () =>
    set({
      status: 'disconnected',
      sessionId: null,
      reconnectAttempts: 0,
      lastError: null,
      latency: null
    })
}))
