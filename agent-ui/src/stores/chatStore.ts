import { create } from 'zustand'
import type { ChatMessage, ExecutionStatus, MessageStatus } from '@/types'

interface ChatState {
  messagesByClient: Record<string, ChatMessage[]>
  loadedClients: Set<string>
  currentExecution: ExecutionStatus
  isLoadingHistory: boolean

  // Actions
  addMessage: (clientId: string, message: ChatMessage) => void
  updateMessage: (
    clientId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void
  updateMessageStatus: (
    clientId: string,
    messageId: string,
    status: MessageStatus
  ) => void
  clearMessages: (clientId: string) => void
  setCurrentExecution: (status: ExecutionStatus) => void
  getMessages: (clientId: string) => ChatMessage[]
  loadMessagesFromDB: (clientId: string) => Promise<void>
  loadMoreMessages: (clientId: string) => Promise<boolean>
}

// Helper to convert DB record to ChatMessage
function dbRecordToMessage(record: {
  id: string
  client_id: string
  type: string
  content: string
  data: string | null
  status: string | null
  created_at: string
}): ChatMessage {
  return {
    id: record.id,
    type: record.type as 'user' | 'ai' | 'system',
    content: record.content,
    data: record.data ? JSON.parse(record.data) : undefined,
    status: (record.status as MessageStatus) || undefined,
    timestamp: new Date(record.created_at)
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  messagesByClient: {},
  loadedClients: new Set(),
  currentExecution: { isExecuting: false },
  isLoadingHistory: false,

  addMessage: (clientId, message) => {
    set((state) => {
      const existing = state.messagesByClient[clientId] || []
      return {
        messagesByClient: {
          ...state.messagesByClient,
          [clientId]: [...existing, message]
        }
      }
    })

    // Save to DB
    window.electronAPI?.db?.insertMessage({
      id: message.id,
      client_id: clientId,
      type: message.type,
      content: message.content,
      data: message.data ? JSON.stringify(message.data) : null,
      status: message.status || null
    }).catch(console.error)
  },

  updateMessage: (clientId, messageId, updates) => {
    set((state) => {
      const messages = state.messagesByClient[clientId] || []
      return {
        messagesByClient: {
          ...state.messagesByClient,
          [clientId]: messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          )
        }
      }
    })

    // Update in DB if status or data changed
    if (updates.status || updates.data) {
      window.electronAPI?.db?.updateMessageStatus(
        messageId,
        updates.status || 'sent',
        updates.data ? JSON.stringify(updates.data) : undefined
      ).catch(console.error)
    }
  },

  updateMessageStatus: (clientId, messageId, status) => {
    set((state) => {
      const messages = state.messagesByClient[clientId] || []
      return {
        messagesByClient: {
          ...state.messagesByClient,
          [clientId]: messages.map((m) =>
            m.id === messageId ? { ...m, status } : m
          )
        }
      }
    })

    // Update in DB
    window.electronAPI?.db?.updateMessageStatus(messageId, status).catch(console.error)
  },

  clearMessages: (clientId) => {
    set((state) => {
      const newLoadedClients = new Set(state.loadedClients)
      newLoadedClients.delete(clientId)
      return {
        messagesByClient: {
          ...state.messagesByClient,
          [clientId]: []
        },
        loadedClients: newLoadedClients
      }
    })

    // Clear from DB
    window.electronAPI?.db?.deleteMessages(clientId).catch(console.error)
  },

  setCurrentExecution: (currentExecution) => set({ currentExecution }),

  getMessages: (clientId) => get().messagesByClient[clientId] || [],

  loadMessagesFromDB: async (clientId) => {
    const state = get()

    // Skip if already loaded
    if (state.loadedClients.has(clientId)) {
      return
    }

    set({ isLoadingHistory: true })

    try {
      const records = await window.electronAPI?.db?.getMessages(clientId, { limit: 100 })
      if (records && records.length > 0) {
        const messages = records.map(dbRecordToMessage)
        set((state) => {
          const newLoadedClients = new Set(state.loadedClients)
          newLoadedClients.add(clientId)
          return {
            messagesByClient: {
              ...state.messagesByClient,
              [clientId]: messages
            },
            loadedClients: newLoadedClients
          }
        })
      } else {
        set((state) => {
          const newLoadedClients = new Set(state.loadedClients)
          newLoadedClients.add(clientId)
          return { loadedClients: newLoadedClients }
        })
      }
    } catch (error) {
      console.error('Failed to load messages from DB:', error)
    } finally {
      set({ isLoadingHistory: false })
    }
  },

  loadMoreMessages: async (clientId) => {
    const state = get()
    const existingMessages = state.messagesByClient[clientId] || []

    if (existingMessages.length === 0) return false

    const oldestMessage = existingMessages[0]

    try {
      const records = await window.electronAPI?.db?.getMessages(clientId, {
        limit: 50,
        before: oldestMessage.timestamp.toISOString()
      })

      if (records && records.length > 0) {
        const messages = records.map(dbRecordToMessage)
        set((state) => ({
          messagesByClient: {
            ...state.messagesByClient,
            [clientId]: [...messages, ...state.messagesByClient[clientId]]
          }
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to load more messages:', error)
      return false
    }
  }
}))
