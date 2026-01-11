import { useEffect, useCallback, useRef } from 'react'
import { websocketService } from '@/services/websocket'
import { useConnectionStore } from '@/stores/connectionStore'
import { useClientStore } from '@/stores/clientStore'
import { useChatStore } from '@/stores/chatStore'
import { useLogStore } from '@/stores/logStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { WSMessage, LogLevel, Client } from '@/types'

export function useWebSocket() {
  const {
    status,
    setStatus,
    setSessionId,
    setLastError,
    setLatency
  } = useConnectionStore()

  const { addClient, updateClientStatus, removeClient, selectClient } = useClientStore()
  const { addMessage, updateMessageStatus, setCurrentExecution } = useChatStore()
  const { addLog } = useLogStore()
  const { settings } = useSettingsStore()

  // Use server URL from settings store (not connectionStore)
  const serverUrl = settings.server.url

  const pingTimestamp = useRef<number>(0)

  // Message handler
  const handleMessage = useCallback(
    (message: WSMessage) => {
      // Calculate latency for heartbeat (don't log heartbeat messages)
      if (message.type === 'HEARTBEAT') {
        if (pingTimestamp.current) {
          const latency = Date.now() - pingTimestamp.current
          setLatency(latency)
          pingTimestamp.current = 0
        }
        return // Skip logging for heartbeat
      }

      // Log the message (except heartbeat)
      const logLevel: LogLevel =
        message.type === 'ERROR'
          ? 'error'
          : message.type === 'RESPONSE' || message.type === 'CONNECT_ACK'
            ? 'success'
            : 'info'

      addLog({
        timestamp: new Date(),
        direction: message.source === 'server' ? 'inbound' : 'outbound',
        type: message.type,
        clientId: message.targetClientId,
        messageId: message.messageId,
        summary: getSummary(message),
        payload: message,
        level: logLevel
      })

      // Handle specific message types
      switch (message.type) {
        case 'CONNECT_ACK':
          if (message.payload?.sessionId) {
            setSessionId(message.payload.sessionId as string)
          }
          break

        case 'STATUS':
          handleStatusMessage(message)
          break

        case 'RESPONSE':
          handleResponseMessage(message)
          break

        case 'ERROR':
          handleErrorMessage(message)
          break
      }
    },
    [addLog, setSessionId, setLatency]
  )

  // Handle STATUS messages (client connect/disconnect)
  const handleStatusMessage = useCallback(
    (message: WSMessage) => {
      const payload = message.payload || {}
      // Server sends 'pairedSessionId' for the extension's session ID
      const extensionId = (payload.pairedSessionId || payload.extensionSessionId) as string | undefined

      if (payload.status === 'paired' && extensionId) {
        // New extension connected and paired with this agent
        const client: Client = {
          id: extensionId,
          sessionId: extensionId,
          name: `Chrome #${extensionId.slice(-4)}`,
          status: 'paired',
          lastActive: new Date(),
          metadata: {
            browser: 'Chrome',
            currentUrl: payload.currentUrl as string | undefined,
            currentTitle: payload.currentTitle as string | undefined
          }
        }
        addClient(client)

        // Auto-select if no client is currently selected
        const currentSelectedId = useClientStore.getState().selectedClientId
        if (!currentSelectedId) {
          selectClient(extensionId)
        }
      } else if (payload.status === 'peer_disconnected') {
        // Extension disconnected
        const disconnectedId = (payload.pairedSessionId || payload.extensionSessionId) as string | undefined
        if (disconnectedId) {
          updateClientStatus(disconnectedId, 'disconnected')
        }
      } else if (payload.status === 'peer_reconnected') {
        // Extension reconnected
        const reconnectedId = (payload.pairedSessionId || payload.extensionSessionId) as string | undefined
        if (reconnectedId) {
          updateClientStatus(reconnectedId, 'paired')
        }
      } else if (payload.status === 'unpaired') {
        // Session unpaired - remove client
        const unpairedId = (payload.pairedSessionId || payload.extensionSessionId) as string | undefined
        if (unpairedId) {
          removeClient(unpairedId)
        }
      }
    },
    [addClient, updateClientStatus, removeClient, selectClient]
  )

  // Handle RESPONSE messages
  const handleResponseMessage = useCallback(
    (message: WSMessage) => {
      const clientId = message.targetClientId
      if (!clientId) return

      // Add AI response message
      addMessage(clientId, {
        id: message.messageId,
        clientId,
        type: 'ai',
        content: message.payload?.text as string || 'Command executed',
        timestamp: new Date(),
        status: 'success',
        data: message.payload?.data
      })

      // Clear execution status
      setCurrentExecution({ isExecuting: false })
    },
    [addMessage, setCurrentExecution]
  )

  // Handle ERROR messages
  const handleErrorMessage = useCallback(
    (message: WSMessage) => {
      const clientId = message.targetClientId
      if (!clientId) return

      addMessage(clientId, {
        id: message.messageId,
        clientId,
        type: 'error',
        content: message.payload?.message as string || 'An error occurred',
        timestamp: new Date(),
        status: 'error',
        error: {
          code: message.payload?.code as string || 'UNKNOWN',
          message: message.payload?.message as string || 'Unknown error'
        }
      })

      setCurrentExecution({ isExecuting: false })
    },
    [addMessage, setCurrentExecution]
  )

  // Connect function
  const connect = useCallback(async () => {
    try {
      await websocketService.connect(serverUrl)

      // Send CONNECT message
      websocketService.send({
        messageId: `connect-${Date.now()}`,
        type: 'CONNECT',
        source: 'agent',
        target: 'server',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Connection failed')
    }
  }, [serverUrl, setLastError])

  // Disconnect function
  const disconnect = useCallback(() => {
    websocketService.disconnect()
  }, [])

  // Send chat message
  const sendChatMessage = useCallback(
    (clientId: string, text: string) => {
      const messageId = `chat-${Date.now()}`

      // Add to log
      addLog({
        timestamp: new Date(),
        direction: 'outbound',
        type: 'CHAT',
        clientId,
        messageId,
        summary: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        payload: { text },
        level: 'info'
      })

      // Send via WebSocket
      return websocketService.send({
        messageId,
        type: 'CHAT',
        source: 'agent',
        target: 'server',
        targetClientId: clientId,
        timestamp: new Date().toISOString(),
        payload: { text }
      })
    },
    [addLog]
  )

  // Setup listeners
  useEffect(() => {
    const unsubMessage = websocketService.onMessage(handleMessage)
    const unsubStatus = websocketService.onStatusChange(setStatus)
    const unsubError = websocketService.onError((error) => {
      setLastError(error)
      addLog({
        timestamp: new Date(),
        direction: 'inbound',
        type: 'ERROR',
        messageId: `error-${Date.now()}`,
        summary: error,
        payload: { error },
        level: 'error'
      })
    })

    // Configure from settings
    websocketService.setMaxReconnectAttempts(settings.server.maxReconnectAttempts)
    websocketService.setReconnectInterval(settings.server.reconnectInterval * 1000)

    // Auto-connect if enabled
    if (settings.server.autoConnect) {
      connect()
    }

    return () => {
      unsubMessage()
      unsubStatus()
      unsubError()
    }
  }, [handleMessage, setStatus, setLastError, addLog, connect, settings.server])

  return {
    status,
    connect,
    disconnect,
    sendChatMessage,
    isConnected: status === 'connected'
  }
}

// Helper to generate log summary
function getSummary(message: WSMessage): string {
  switch (message.type) {
    case 'CONNECT':
      return 'Agent connecting...'
    case 'CONNECT_ACK':
      return `Session: ${message.payload?.sessionId}`
    case 'CHAT':
      return (message.payload?.text as string || '').substring(0, 50)
    case 'COMMAND':
      return `${message.payload?.command} command`
    case 'RESPONSE':
      return message.payload?.success ? 'Success' : 'Failed'
    case 'STATUS':
      return message.payload?.status as string || 'Status update'
    case 'HEARTBEAT':
      return 'Heartbeat'
    case 'ERROR':
      return message.payload?.message as string || 'Error'
    default:
      return message.type
  }
}
