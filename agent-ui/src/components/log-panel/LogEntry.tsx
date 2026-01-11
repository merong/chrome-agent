import { ArrowRight, ArrowLeft, Info } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import type { LogEntry as LogEntryType, LogLevel } from '@/types'

interface LogEntryProps {
  entry: LogEntryType
  isSelected: boolean
  onClick: () => void
}

const levelColors: Record<LogLevel, string> = {
  info: 'text-foreground-muted',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error'
}

const typeColors: Record<string, string> = {
  CONNECT: 'bg-info/20 text-info',
  CONNECT_ACK: 'bg-success/20 text-success',
  CHAT: 'bg-primary/20 text-primary',
  COMMAND: 'bg-warning/20 text-warning',
  RESPONSE: 'bg-success/20 text-success',
  STATUS: 'bg-foreground-muted/20 text-foreground-muted',
  HEARTBEAT: 'bg-foreground-muted/20 text-foreground-muted',
  ERROR: 'bg-error/20 text-error'
}

export function LogEntry({ entry, isSelected, onClick }: LogEntryProps): React.ReactElement {
  const DirectionIcon = entry.direction === 'outbound' ? ArrowRight : ArrowLeft
  const directionColor = entry.direction === 'outbound' ? 'text-primary' : 'text-success'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 hover:bg-background-secondary transition-colors',
        isSelected && 'bg-primary/10'
      )}
    >
      {/* First Row: Timestamp, Direction, Type */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-foreground-muted font-mono">
          {format(entry.timestamp, 'HH:mm:ss.SSS')}
        </span>
        <DirectionIcon className={cn('w-3 h-3', directionColor)} />
        <span
          className={cn(
            'text-[10px] px-1.5 py-0.5 rounded font-medium',
            typeColors[entry.type] || 'bg-foreground-muted/20 text-foreground-muted'
          )}
        >
          {entry.type}
        </span>
        {entry.level !== 'info' && (
          <span className={cn('text-[10px]', levelColors[entry.level])}>
            {entry.level === 'success' && '✓'}
            {entry.level === 'warning' && '⚠'}
            {entry.level === 'error' && '✗'}
          </span>
        )}
      </div>

      {/* Second Row: Client & Summary */}
      <div className="mt-1">
        {entry.clientName && (
          <span className="text-[10px] text-foreground-muted mr-2">[{entry.clientName}]</span>
        )}
        <span className="text-xs text-foreground-secondary truncate block">{entry.summary}</span>
      </div>
    </button>
  )
}
