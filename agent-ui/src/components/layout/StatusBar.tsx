import { Wifi, WifiOff, Clock, MessageSquare, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useConnectionStore } from '@/stores/connectionStore'
import { useLogStore } from '@/stores/logStore'
import { useUIStore } from '@/stores/uiStore'
import { useClientStore } from '@/stores/clientStore'

export function StatusBar(): React.ReactElement {
  const { status, latency, lastError, reconnectAttempts, maxReconnectAttempts } = useConnectionStore()
  const { entries } = useLogStore()
  const { logPanelOpen, toggleLogPanel } = useUIStore()
  const { clients } = useClientStore()

  const isConnected = status === 'connected'
  const isReconnecting = status === 'reconnecting'
  const hasError = status === 'error' || (status === 'disconnected' && lastError)

  const getStatusText = () => {
    if (status === 'reconnecting') {
      return `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
    }
    return {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      error: 'Connection Error'
    }[status]
  }

  const statusConfig = {
    connected: { icon: Wifi, color: 'text-success' },
    connecting: { icon: Wifi, color: 'text-warning' },
    reconnecting: { icon: Wifi, color: 'text-warning' },
    disconnected: { icon: WifiOff, color: 'text-foreground-muted' },
    error: { icon: WifiOff, color: 'text-error' }
  }[status]

  const StatusIcon = statusConfig.icon

  // Truncate error message for status bar
  const truncatedError = lastError && lastError.length > 60
    ? lastError.substring(0, 60) + '...'
    : lastError

  return (
    <footer className="h-7 flex items-center justify-between px-4 bg-background-secondary border-t border-border text-xs">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Connection Status */}
        <div className={cn('flex items-center gap-1.5 shrink-0', statusConfig.color)}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span>{getStatusText()}</span>
        </div>

        {/* Error Message */}
        {hasError && lastError && (
          <div className="flex items-center gap-1.5 text-error min-w-0" title={lastError}>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{truncatedError}</span>
          </div>
        )}

        {/* Latency */}
        {isConnected && latency !== null && (
          <div className="flex items-center gap-1.5 text-foreground-secondary shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>{latency}ms</span>
          </div>
        )}

        {/* Client Count */}
        {isConnected && (
          <div className="flex items-center gap-1.5 text-foreground-secondary shrink-0">
            <span>{clients.length} Client{clients.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Log Count - Clickable to toggle log panel */}
        <button
          onClick={toggleLogPanel}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            logPanelOpen ? 'text-primary' : 'text-foreground-secondary hover:text-foreground'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{entries.length} logs</span>
        </button>
      </div>
    </footer>
  )
}
