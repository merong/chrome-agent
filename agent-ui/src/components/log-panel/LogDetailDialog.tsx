import { X, Copy, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import type { LogEntry } from '@/types'

interface LogDetailDialogProps {
  entry: LogEntry
  isOpen: boolean
  onClose: () => void
}

export function LogDetailDialog({ entry, isOpen, onClose }: LogDetailDialogProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      const content = JSON.stringify(entry.data || entry, null, 2)
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const DirectionIcon = entry.direction === 'outbound' ? ArrowRight : ArrowLeft
  const directionLabel = entry.direction === 'outbound' ? 'Outbound' : 'Inbound'
  const directionColor = entry.direction === 'outbound' ? 'text-primary' : 'text-success'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">로그 상세 정보</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-foreground-muted text-xs">Timestamp</label>
              <p className="font-mono text-foreground">
                {format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
              </p>
            </div>
            <div>
              <label className="text-foreground-muted text-xs">Type</label>
              <p className="font-medium text-foreground">{entry.type}</p>
            </div>
            <div>
              <label className="text-foreground-muted text-xs">Direction</label>
              <p className={cn('flex items-center gap-1 font-medium', directionColor)}>
                <DirectionIcon className="w-4 h-4" />
                {directionLabel}
              </p>
            </div>
            <div>
              <label className="text-foreground-muted text-xs">Level</label>
              <p className={cn(
                'font-medium capitalize',
                entry.level === 'success' && 'text-success',
                entry.level === 'error' && 'text-error',
                entry.level === 'warning' && 'text-warning',
                entry.level === 'info' && 'text-foreground-secondary'
              )}>
                {entry.level}
              </p>
            </div>
            {entry.clientName && (
              <div className="col-span-2">
                <label className="text-foreground-muted text-xs">Client</label>
                <p className="font-medium text-foreground">{entry.clientName}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="text-foreground-muted text-xs">Summary</label>
            <p className="text-foreground">{entry.summary}</p>
          </div>

          {/* Data */}
          {entry.data && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-foreground-muted text-xs">Data</label>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                    copied
                      ? 'bg-success/20 text-success'
                      : 'hover:bg-background-secondary text-foreground-secondary'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      복사
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 bg-background-secondary rounded-md text-xs font-mono text-foreground-secondary overflow-auto max-h-64">
                {typeof entry.data === 'string'
                  ? entry.data
                  : JSON.stringify(entry.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-background-secondary hover:bg-background-tertiary rounded-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
