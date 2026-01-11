import { create } from 'zustand'
import type { ToastType } from '@/components/common/Toast'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

let toastId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    return id
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),

  clearAll: () => set({ toasts: [] })
}))

// Utility functions for quick toast creation
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().addToast({ type: 'info', title, message })
}
