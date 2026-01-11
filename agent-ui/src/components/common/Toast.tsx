import { clsx } from 'clsx';
import { useAppStore } from '@/stores/appStore';
import type { ToastType } from '@/types';

const toastConfig: Record<
  ToastType,
  { bg: string; border: string; icon: string }
> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    icon: '✅',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: '❌',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    icon: '⚠️',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    icon: 'ℹ️',
  },
};

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.slice(-3).map((toast) => {
        const config = toastConfig[toast.type];

        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-md',
              'animate-slide-in-right',
              config.bg,
              config.border
            )}
            role="alert"
          >
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm text-gray-700 flex-1">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
