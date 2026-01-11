// Connection types
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'

// Client types
export type ClientStatus =
  | 'connecting'
  | 'connected'
  | 'paired'
  | 'disconnected'
  | 'error'

export interface Client {
  id: string
  sessionId: string
  name: string
  status: ClientStatus
  lastActive: Date
  metadata: {
    browser: string
    currentUrl?: string
    currentTitle?: string
  }
}

// Message types
export type MessageType =
  | 'CONNECT'
  | 'CONNECT_ACK'
  | 'CHAT'
  | 'COMMAND'
  | 'RESPONSE'
  | 'STATUS'
  | 'HEARTBEAT'
  | 'ERROR'

export type MessageStatus =
  | 'sending'
  | 'processing'
  | 'executing'
  | 'success'
  | 'error'
  | 'timeout'

export interface ChatMessage {
  id: string
  clientId: string
  type: 'user' | 'ai' | 'system' | 'error'
  content: string
  timestamp: Date
  status?: MessageStatus
  data?: unknown
  error?: ErrorInfo
}

export interface ErrorInfo {
  code: string
  message: string
  details?: unknown
}

// WebSocket message
export interface WSMessage {
  messageId: string
  timestamp?: string
  type: MessageType
  source: 'agent' | 'extension' | 'server'
  target: 'agent' | 'extension' | 'server'
  targetClientId?: string
  payload?: Record<string, unknown>
  requestId?: string
}

// Log types
export type LogLevel = 'info' | 'success' | 'warning' | 'error'

export interface LogEntry {
  id: string
  timestamp: Date
  direction: 'inbound' | 'outbound'
  type: MessageType
  clientId?: string
  clientName?: string
  messageId: string
  summary: string
  payload: unknown
  level: LogLevel
}

export interface LogFilter {
  types?: MessageType[]
  clientIds?: string[]
  direction?: 'inbound' | 'outbound' | 'all'
  level?: LogLevel[]
  search?: string
  timeRange?: {
    start: Date
    end: Date
  }
}

// Settings types
export interface ServerSettings {
  url: string
  autoConnect: boolean
  maxReconnectAttempts: number
  reconnectInterval: number
  heartbeatInterval: number
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  fontSize: number
  sidebarPosition: 'left' | 'right'
}

export interface NotificationSettings {
  desktop: boolean
  sound: boolean
  connectionStatus: boolean
  commandComplete: boolean
}

export interface DesktopSettings {
  systemTray: boolean
  startMinimized: boolean
  autoStart: boolean
}

export interface ShortcutSettings {
  sendMessage: string
  newConversation: string
  openSettings: string
  toggleLogPanel: string
}

export interface AppSettings {
  server: ServerSettings
  ui: UISettings
  notifications: NotificationSettings
  desktop: DesktopSettings
  shortcuts: ShortcutSettings
}

// Execution status
export interface ExecutionStatus {
  isExecuting: boolean
  currentStep?: string
  progress?: number
}

// Template types
export interface Template {
  id: string
  name: string
  content: string
  description?: string
  category: string
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export type TemplateCategory = 'general' | 'extraction' | 'navigation' | 'form' | 'custom'
