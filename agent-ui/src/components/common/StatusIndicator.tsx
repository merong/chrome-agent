import { cn } from '@/utils/cn'
import type { ClientStatus, ConnectionStatus } from '@/types'

interface StatusIndicatorProps {
  status: ClientStatus | ConnectionStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3'
}

const statusConfig: Record<
  ClientStatus | ConnectionStatus,
  { color: string; label: string; animate?: boolean }
> = {
  connected: { color: 'bg-success', label: 'Connected' },
  connecting: { color: 'bg-warning', label: 'Connecting', animate: true },
  reconnecting: { color: 'bg-warning', label: 'Reconnecting', animate: true },
  paired: { color: 'bg-success', label: 'Paired' },
  disconnected: { color: 'bg-foreground-muted', label: 'Disconnected' },
  error: { color: 'bg-error', label: 'Error' }
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  className
}: StatusIndicatorProps): React.ReactElement {
  const config = statusConfig[status]

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div
        className={cn(
          'rounded-full',
          sizeClasses[size],
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-xs text-foreground-secondary">{config.label}</span>
      )}
    </div>
  )
}
