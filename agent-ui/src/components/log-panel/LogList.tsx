import { useRef, useEffect } from 'react'
import type { LogEntry as LogEntryType } from '@/types'
import { LogEntry } from './LogEntry'
import { useLogStore } from '@/stores/logStore'

interface LogListProps {
  entries: LogEntryType[]
}

export function LogList({ entries }: LogListProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { isPaused, selectLog, selectedLogId } = useLogStore()

  // Auto-scroll when not paused
  useEffect(() => {
    if (!isPaused) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length, isPaused])

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-foreground-muted">No logs yet</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <LogEntry
            key={entry.id}
            entry={entry}
            isSelected={entry.id === selectedLogId}
            onClick={() => selectLog(entry.id)}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
