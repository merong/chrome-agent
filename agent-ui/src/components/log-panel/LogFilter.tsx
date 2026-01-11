import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useLogStore } from '@/stores/logStore'
import type { MessageType } from '@/types'

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: 'CONNECT', label: 'Connect' },
  { value: 'CONNECT_ACK', label: 'Connect ACK' },
  { value: 'CHAT', label: 'Chat' },
  { value: 'COMMAND', label: 'Command' },
  { value: 'RESPONSE', label: 'Response' },
  { value: 'STATUS', label: 'Status' },
  { value: 'HEARTBEAT', label: 'Heartbeat' },
  { value: 'ERROR', label: 'Error' }
]

const DIRECTIONS = [
  { value: 'all', label: 'All' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' }
] as const

export function LogFilter(): React.ReactElement {
  const { filter, setFilter } = useLogStore()
  const [typeOpen, setTypeOpen] = useState(false)
  const [directionOpen, setDirectionOpen] = useState(false)

  const selectedTypeLabel =
    filter.types && filter.types.length > 0
      ? filter.types.length === 1
        ? MESSAGE_TYPES.find((t) => t.value === filter.types![0])?.label
        : `${filter.types.length} types`
      : 'All Types'

  const selectedDirectionLabel =
    DIRECTIONS.find((d) => d.value === (filter.direction || 'all'))?.label || 'All'

  return (
    <div className="flex items-center gap-2">
      {/* Type Filter */}
      <div className="relative">
        <button
          onClick={() => setTypeOpen(!typeOpen)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded border border-border',
            'hover:bg-background-secondary transition-colors'
          )}
        >
          <span>{selectedTypeLabel}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {typeOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setTypeOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-36 bg-background border border-border rounded-md shadow-lg z-50">
              <button
                onClick={() => {
                  setFilter({ types: undefined })
                  setTypeOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs hover:bg-background-secondary',
                  !filter.types && 'text-primary'
                )}
              >
                All Types
              </button>
              {MESSAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    const current = filter.types || []
                    const newTypes = current.includes(type.value)
                      ? current.filter((t) => t !== type.value)
                      : [...current, type.value]
                    setFilter({ types: newTypes.length > 0 ? newTypes : undefined })
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs hover:bg-background-secondary',
                    filter.types?.includes(type.value) && 'text-primary'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Direction Filter */}
      <div className="relative">
        <button
          onClick={() => setDirectionOpen(!directionOpen)}
          className={cn(
            'flex items-center gap-1 px-2 py-1 text-xs rounded border border-border',
            'hover:bg-background-secondary transition-colors'
          )}
        >
          <span>{selectedDirectionLabel}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {directionOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setDirectionOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-28 bg-background border border-border rounded-md shadow-lg z-50">
              {DIRECTIONS.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => {
                    setFilter({ direction: dir.value })
                    setDirectionOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-xs hover:bg-background-secondary',
                    filter.direction === dir.value && 'text-primary'
                  )}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
