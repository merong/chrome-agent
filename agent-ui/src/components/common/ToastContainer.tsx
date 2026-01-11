import { Toast, ToastType } from './Toast'
import { useToastStore } from '@/stores/toastStore'

export function ToastContainer(): React.ReactElement {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}

// Hook for easy toast usage
export { useToastStore } from '@/stores/toastStore'
