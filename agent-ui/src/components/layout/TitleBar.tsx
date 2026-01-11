import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy, Bell, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useConnectionStore } from '@/stores/connectionStore'
import { useUIStore } from '@/stores/uiStore'

export function TitleBar(): React.ReactElement {
  const [isMaximized, setIsMaximized] = useState(false)
  const { status } = useConnectionStore()
  const { setSettingsOpen } = useUIStore()
  const isMac = window.electronAPI?.platform === 'darwin'

  useEffect(() => {
    // Check initial maximized state
    window.electronAPI?.isMaximized().then(setIsMaximized)

    // Listen for maximize/unmaximize events
    const cleanup = window.electronAPI?.onMaximizedChange(setIsMaximized)
    return () => cleanup?.()
  }, [])

  const handleMinimize = () => window.electronAPI?.minimize()
  const handleMaximize = () => window.electronAPI?.maximize()
  const handleClose = () => window.electronAPI?.close()

  const statusColor = {
    connected: 'bg-success',
    connecting: 'bg-warning animate-pulse',
    reconnecting: 'bg-warning animate-pulse',
    disconnected: 'bg-foreground-muted',
    error: 'bg-error'
  }[status]

  return (
    <header
      className={cn(
        'h-10 flex items-center justify-between px-4 bg-background-secondary border-b border-border drag-region',
        isMac ? 'pl-20' : ''
      )}
    >
      {/* Left Section - App Title & Connection Status */}
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', statusColor)} />
          <span className="text-sm font-semibold">Chrome Agent</span>
        </div>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-1 no-drag">
        {/* Notification Bell */}
        <button
          className="p-2 rounded hover:bg-background-tertiary transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-foreground-secondary" />
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded hover:bg-background-tertiary transition-colors"
          title="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="w-4 h-4 text-foreground-secondary" />
        </button>

        {/* Window Controls - Only show on Windows/Linux */}
        {!isMac && (
          <div className="flex items-center ml-2">
            <button
              onClick={handleMinimize}
              className="p-2 hover:bg-background-tertiary transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleMaximize}
              className="p-2 hover:bg-background-tertiary transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <Copy className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-error hover:text-error-foreground transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
