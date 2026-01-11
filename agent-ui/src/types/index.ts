// Connection Status Types
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

// Command Execution Status
export type ExecutionStatus =
  | 'idle'
  | 'sending'
  | 'processing'
  | 'executing'
  | 'success'
  | 'error'
  | 'timeout';

// Message Types (matching server protocol)
export type MessageType =
  | 'CONNECT'
  | 'CONNECT_ACK'
  | 'CHAT'
  | 'COMMAND'
  | 'RESPONSE'
  | 'STATUS'
  | 'HEARTBEAT'
  | 'ERROR';

// Message Sender
export type MessageSender = 'user' | 'ai' | 'system';

// Chat Message
export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  status?: ExecutionStatus;
  data?: unknown;
  error?: ErrorInfo;
}

// Error Info
export interface ErrorInfo {
  code: string;
  message: string;
  suggestion?: string;
}

// WebSocket Message Structure
export interface WSMessage {
  messageId: string;
  timestamp?: string;
  type: MessageType;
  source: 'agent' | 'extension' | 'server';
  target: 'agent' | 'extension' | 'server';
  payload?: Record<string, unknown>;
  requestId?: string;
}

// Connect Acknowledgment Payload
export interface ConnectAckPayload {
  sessionId: string;
  status: string;
}

// Status Payload
export interface StatusPayload {
  status: 'paired' | 'peer_disconnected' | 'peer_reconnected';
  peerType?: 'agent' | 'extension';
}

// Response Payload
export interface ResponsePayload {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  executionTime?: number;
}

// Error Payload
export interface ErrorPayload {
  code: string;
  message: string;
  requestId?: string;
}

// Command Types
export type CommandType =
  | 'EXTRACT_COOKIES'
  | 'EXTRACT_DOM'
  | 'EXTRACT_FORM'
  | 'GET_PAGE_INFO';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
