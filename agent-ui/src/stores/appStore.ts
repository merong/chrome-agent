import { create } from 'zustand';
import type {
  ConnectionStatus,
  ChatMessage,
  Toast,
  MessageSender,
  ExecutionStatus,
} from '@/types';

interface AppState {
  // Connection State
  serverStatus: ConnectionStatus;
  extensionStatus: 'unknown' | 'connected' | 'disconnected';
  sessionId: string | null;
  responseTime: number | null;

  // Messages
  messages: ChatMessage[];

  // Toasts
  toasts: Toast[];

  // Current Execution
  currentExecution: ExecutionStatus;

  // Actions
  setServerStatus: (status: ConnectionStatus) => void;
  setExtensionStatus: (status: 'unknown' | 'connected' | 'disconnected') => void;
  setSessionId: (sessionId: string | null) => void;
  setResponseTime: (time: number | null) => void;

  addMessage: (
    sender: MessageSender,
    content: string,
    data?: unknown
  ) => ChatMessage;
  updateMessageStatus: (messageId: string, status: ExecutionStatus) => void;
  updateMessageData: (messageId: string, data: unknown) => void;
  clearMessages: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  setCurrentExecution: (status: ExecutionStatus) => void;

  reset: () => void;
}

const generateId = () => crypto.randomUUID();

const initialState = {
  serverStatus: 'disconnected' as ConnectionStatus,
  extensionStatus: 'unknown' as const,
  sessionId: null,
  responseTime: null,
  messages: [] as ChatMessage[],
  toasts: [] as Toast[],
  currentExecution: 'idle' as ExecutionStatus,
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,

  setServerStatus: (status) => set({ serverStatus: status }),

  setExtensionStatus: (status) => set({ extensionStatus: status }),

  setSessionId: (sessionId) => set({ sessionId }),

  setResponseTime: (time) => set({ responseTime: time }),

  addMessage: (sender, content, data) => {
    const message: ChatMessage = {
      id: generateId(),
      sender,
      content,
      timestamp: new Date(),
      status: sender === 'user' ? 'sending' : undefined,
      data,
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return message;
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg
      ),
    }));
  },

  updateMessageData: (messageId, data) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, data } : msg
      ),
    }));
  },

  clearMessages: () => set({ messages: [] }),

  addToast: (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto remove after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000);
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setCurrentExecution: (status) => set({ currentExecution: status }),

  reset: () => set(initialState),
}));
