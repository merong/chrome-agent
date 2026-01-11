import { clsx } from 'clsx';
import type { ConnectionStatus } from '@/types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  ConnectionStatus,
  { color: string; text: string; animate: boolean }
> = {
  disconnected: {
    color: 'bg-gray-500',
    text: '연결 안됨',
    animate: false,
  },
  connecting: {
    color: 'bg-amber-500',
    text: '연결 중...',
    animate: true,
  },
  connected: {
    color: 'bg-emerald-500',
    text: '연결됨',
    animate: false,
  },
  reconnecting: {
    color: 'bg-orange-500',
    text: '재연결 중...',
    animate: true,
  },
  error: {
    color: 'bg-red-500',
    text: '연결 오류',
    animate: false,
  },
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusIndicator({
  status,
  showText = true,
  size = 'md',
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-live="polite"
      aria-label={`연결 상태: ${config.text}`}
    >
      <span
        className={clsx(
          'rounded-full',
          sizeConfig[size],
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      {showText && (
        <span className="text-sm text-gray-600">{config.text}</span>
      )}
    </div>
  );
}
