import { create } from 'zustand'
import type { Client, ClientStatus } from '@/types'
import { useChatStore } from './chatStore'

interface ClientState {
  clients: Client[]
  selectedClientId: string | null
  isLoadingClients: boolean

  // Actions
  addClient: (client: Client) => void
  removeClient: (clientId: string) => void
  updateClient: (clientId: string, updates: Partial<Client>) => void
  updateClientStatus: (clientId: string, status: ClientStatus) => void
  selectClient: (clientId: string | null) => void
  clearClients: () => void
  loadClientsFromDB: () => Promise<void>
  setClientName: (clientId: string, name: string) => void
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  selectedClientId: null,
  isLoadingClients: false,

  addClient: (client) => {
    set((state) => {
      // Check if client already exists
      const exists = state.clients.some((c) => c.id === client.id)
      if (exists) {
        return {
          clients: state.clients.map((c) => (c.id === client.id ? client : c))
        }
      }
      return { clients: [...state.clients, client] }
    })

    // Save to DB
    window.electronAPI?.db?.upsertClient({
      id: client.id,
      name: client.name || null,
      last_session_id: client.sessionId || null,
      last_active: client.lastActive?.toISOString() || new Date().toISOString(),
      metadata: client.metadata ? JSON.stringify(client.metadata) : null
    }).catch(console.error)
  },

  removeClient: (clientId) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
      selectedClientId:
        state.selectedClientId === clientId ? null : state.selectedClientId
    }))

    // Remove from DB
    window.electronAPI?.db?.deleteClient(clientId).catch(console.error)
  },

  updateClient: (clientId, updates) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, ...updates } : c
      )
    }))

    // Update in DB
    const client = get().clients.find((c) => c.id === clientId)
    if (client) {
      window.electronAPI?.db?.upsertClient({
        id: clientId,
        name: updates.name ?? client.name ?? null,
        last_session_id: updates.sessionId ?? client.sessionId ?? null,
        last_active: updates.lastActive?.toISOString() ?? client.lastActive?.toISOString() ?? null,
        metadata: updates.metadata ? JSON.stringify(updates.metadata) : null
      }).catch(console.error)
    }
  },

  updateClientStatus: (clientId, status) => {
    const now = new Date()
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, status, lastActive: now } : c
      )
    }))

    // Update last_active in DB
    window.electronAPI?.db?.upsertClient({
      id: clientId,
      last_active: now.toISOString()
    }).catch(console.error)
  },

  selectClient: async (clientId) => {
    set({ selectedClientId: clientId })

    // Load messages from DB when client is selected
    if (clientId) {
      useChatStore.getState().loadMessagesFromDB(clientId)
    }
  },

  clearClients: () => set({ clients: [], selectedClientId: null }),

  loadClientsFromDB: async () => {
    set({ isLoadingClients: true })
    try {
      const records = await window.electronAPI?.db?.getClients()
      if (records && records.length > 0) {
        const clients: Client[] = records.map((r) => ({
          id: r.id,
          name: r.name || undefined,
          sessionId: r.last_session_id || undefined,
          status: 'disconnected' as ClientStatus, // All loaded clients start as disconnected
          lastActive: r.last_active ? new Date(r.last_active) : undefined,
          metadata: r.metadata ? JSON.parse(r.metadata) : undefined
        }))
        set({ clients })
      }
    } catch (error) {
      console.error('Failed to load clients from DB:', error)
    } finally {
      set({ isLoadingClients: false })
    }
  },

  setClientName: (clientId, name) => {
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === clientId ? { ...c, name } : c
      )
    }))

    // Update in DB
    window.electronAPI?.db?.upsertClient({
      id: clientId,
      name
    }).catch(console.error)
  }
}))
