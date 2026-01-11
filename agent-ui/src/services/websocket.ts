import type { WSMessage, MessageType, ConnectionStatus } from '@/types'

type MessageHandler = (message: WSMessage) => void
type StatusHandler = (status: ConnectionStatus) => void
type ErrorHandler = (error: string) => void

export interface ConnectionTestResult {
  success: boolean
  message: string
  latency?: number
}

export class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private messageHandlers: MessageHandler[] = []
  private statusHandlers: StatusHandler[] = []
  private errorHandlers: ErrorHandler[] = []
  private url: string = ''
  private lastError: string = ''

  constructor() {
    // Bind methods
    this.connect = this.connect.bind(this)
    this.disconnect = this.disconnect.bind(this)
    this.send = this.send.bind(this)
  }

  async connect(url: string): Promise<void> {
    this.url = url
    this.lastError = ''
    this.notifyStatus('connecting')

    return new Promise((resolve, reject) => {
      try {
        // Validate URL format
        if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
          const error = `Invalid WebSocket URL: ${url}. URL must start with ws:// or wss://`
          this.lastError = error
          this.notifyError(error)
          this.notifyStatus('error')
          reject(new Error(error))
          return
        }

        this.socket = new WebSocket(url)

        // Connection timeout
        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
            const error = `Connection timeout: Failed to connect to ${url} within 10 seconds`
            this.lastError = error
            this.notifyError(error)
            this.socket.close()
            reject(new Error(error))
          }
        }, 10000)

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout)
          this.reconnectAttempts = 0
          this.lastError = ''
          this.startHeartbeat()
          this.notifyStatus('connected')
          resolve()
        }

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage
            this.handleMessage(message)
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error)
          }
        }

        this.socket.onerror = () => {
          clearTimeout(connectionTimeout)
          const error = this.lastError || `Connection error: Unable to connect to ${url}`
          this.lastError = error
          this.notifyError(error)
          this.notifyStatus('error')
        }

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout)
          this.stopHeartbeat()

          // Construct meaningful close message
          const closeMessage = this.getCloseMessage(event.code, event.reason, url)
          if (!event.wasClean) {
            this.lastError = closeMessage
            this.notifyError(closeMessage)
          }

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect()
          } else {
            this.notifyStatus('disconnected')
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
        console.error('[WebSocket] Connection failed:', errorMessage)
        this.lastError = errorMessage
        this.notifyError(errorMessage)
        this.notifyStatus('error')
        reject(error)
      }
    })
  }

  // Test connection without maintaining it
  async testConnection(url: string): Promise<ConnectionTestResult> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      try {
        // Validate URL format
        if (!url || (!url.startsWith('ws://') && !url.startsWith('wss://'))) {
          resolve({
            success: false,
            message: `Invalid URL format. URL must start with ws:// or wss://`
          })
          return
        }

        const testSocket = new WebSocket(url)

        const timeout = setTimeout(() => {
          testSocket.close()
          resolve({
            success: false,
            message: `Connection timeout: Server did not respond within 5 seconds`
          })
        }, 5000)

        testSocket.onopen = () => {
          clearTimeout(timeout)
          const latency = Date.now() - startTime
          testSocket.close(1000, 'Test complete')
          resolve({
            success: true,
            message: `Connected successfully (${latency}ms)`,
            latency
          })
        }

        testSocket.onerror = () => {
          clearTimeout(timeout)
          resolve({
            success: false,
            message: `Connection failed: Unable to reach server at ${url}`
          })
        }

        testSocket.onclose = (event) => {
          clearTimeout(timeout)
          if (event.code !== 1000) {
            resolve({
              success: false,
              message: this.getCloseMessage(event.code, event.reason, url)
            })
          }
        }
      } catch (error) {
        resolve({
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
    })
  }

  private getCloseMessage(code: number, reason: string, url: string): string {
    if (reason) return reason

    switch (code) {
      case 1000:
        return 'Connection closed normally'
      case 1001:
        return 'Server is going away'
      case 1002:
        return 'Protocol error'
      case 1003:
        return 'Unsupported data type'
      case 1006:
        return `Connection lost: Server at ${url} is not reachable. Check if the server is running.`
      case 1007:
        return 'Invalid data received'
      case 1008:
        return 'Policy violation'
      case 1009:
        return 'Message too large'
      case 1010:
        return 'Extension required'
      case 1011:
        return 'Internal server error'
      case 1015:
        return 'TLS handshake failed'
      default:
        return `Connection closed with code ${code}`
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.close(1000, 'User disconnect')
      this.socket = null
    }
    this.notifyStatus('disconnected')
  }

  send(message: WSMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send - not connected')
      return false
    }

    try {
      this.socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('[WebSocket] Send failed:', error)
      return false
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler)
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler)
    }
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler)
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler)
    }
  }

  getLastError(): string {
    return this.lastError
  }

  setMaxReconnectAttempts(max: number): void {
    this.maxReconnectAttempts = max
  }

  setReconnectInterval(interval: number): void {
    this.reconnectInterval = interval
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN
  }

  private handleMessage(message: WSMessage): void {
    // Handle heartbeat internally
    if (message.type === 'HEARTBEAT') {
      this.sendHeartbeatAck()
    }

    // Notify handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message)
      } catch (error) {
        console.error('[WebSocket] Handler error:', error)
      }
    })
  }

  private notifyStatus(status: ConnectionStatus): void {
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status)
      } catch (error) {
        console.error('[WebSocket] Status handler error:', error)
      }
    })
  }

  private notifyError(errorMessage: string): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(errorMessage)
      } catch (error) {
        console.error('[WebSocket] Error handler error:', error)
      }
    })
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++
    this.notifyStatus('reconnecting')

    console.log(
      `[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    setTimeout(() => {
      this.connect(this.url).catch(() => {
        // Reconnect failed, will be handled by onclose
      })
    }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)) // Exponential backoff
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          messageId: `hb-${Date.now()}`,
          type: 'HEARTBEAT',
          source: 'agent',
          target: 'server',
          timestamp: new Date().toISOString()
        })
      }
    }, 10000) // 10 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private sendHeartbeatAck(): void {
    this.send({
      messageId: `hb-ack-${Date.now()}`,
      type: 'HEARTBEAT',
      source: 'agent',
      target: 'server',
      timestamp: new Date().toISOString()
    })
  }
}

// Singleton instance
export const websocketService = new WebSocketService()
