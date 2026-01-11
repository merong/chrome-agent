import { useState } from 'react'
import { Pause, Play, X, Trash2, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLogStore } from '@/stores/logStore'
import { useUIStore } from '@/stores/uiStore'
import { LogFilter } from './LogFilter'
import { LogSearch } from './LogSearch'
import { exportToFile, type ExportFormat } from '@/utils/export'
import { toast } from '@/stores/toastStore'

interface LogPanelHeaderProps {
  title: string
  entryCount: number
}

export function LogPanelHeader({
  title,
  entryCount
}: LogPanelHeaderProps): React.ReactElement {
  const { isPaused, togglePause, clearLogs, filteredLogs } = useLogStore()
  const { setLogPanelOpen } = useUIStore()
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setShowExportMenu(false)

    // Convert logs to exportable format
    const logsData = filteredLogs.map((log) => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      type: log.type,
      direction: log.direction,
      level: log.level,
      clientId: log.clientId,
      clientName: log.clientName,
      messageId: log.messageId,
      summary: log.summary,
      payload: log.payload
    }))

    const result = await exportToFile(logsData, format, 'logs')
    if (result.success) {
      toast.success('Export completed', `Logs exported as ${format.toUpperCase()}`)
    } else if (result.error !== 'Export cancelled') {
      toast.error('Export failed', result.error)
    }
  }

  return (
    <div className="border-b border-border">
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-background-secondary">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
            {title}
          </span>
          <span className="text-xs text-foreground-muted">({entryCount})</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Pause/Resume */}
          <button
            onClick={togglePause}
            className={cn(
              'p-1.5 rounded transition-colors',
              isPaused
                ? 'text-warning bg-warning/10'
                : 'text-foreground-secondary hover:bg-background-tertiary'
            )}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 rounded text-foreground-secondary hover:bg-background-tertiary transition-colors"
              title="Export logs"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border rounded-md shadow-lg py-1 min-w-[100px]">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-background-secondary"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-background-secondary"
                  >
                    Export CSV
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={clearLogs}
            className="p-1.5 rounded text-foreground-secondary hover:bg-background-tertiary transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={() => setLogPanelOpen(false)}
            className="p-1.5 rounded text-foreground-secondary hover:bg-background-tertiary transition-colors"
            title="Close panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-3 py-2">
        <LogFilter />
        <LogSearch />
      </div>
    </div>
  )
}
