import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const styles: Record<ToastType, string> = {
  success: 'bg-success/10 border-success/50 text-success',
  error: 'bg-error/10 border-error/50 text-error',
  warning: 'bg-warning/10 border-warning/50 text-warning',
  info: 'bg-info/10 border-info/50 text-info'
}

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}: ToastProps): React.ReactElement {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = icons[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 200)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'transform transition-all duration-200 ease-out',
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
        styles[type]
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && (
          <p className="mt-1 text-xs opacity-80">{message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
