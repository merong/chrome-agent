import { Chrome, Globe } from 'lucide-react'
import { cn } from '@/utils/cn'
import { StatusIndicator } from '../common/StatusIndicator'
import type { Client } from '@/types'

interface ClientItemProps {
  client: Client
  isSelected: boolean
  onSelect: () => void
}

export function ClientItem({
  client,
  isSelected,
  onSelect
}: ClientItemProps): React.ReactElement {
  const displayName = client.name || `Chrome #${client.id.slice(-4)}`
  const displayUrl = client.metadata.currentUrl
    ? new URL(client.metadata.currentUrl).hostname
    : 'No page'

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-background-tertiary text-foreground'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0',
          isSelected ? 'bg-primary/20' : 'bg-background-tertiary'
        )}
      >
        <Chrome className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          <StatusIndicator status={client.status} size="sm" />
        </div>
        <div className="flex items-center gap-1 text-xs text-foreground-muted truncate">
          <Globe className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{displayUrl}</span>
        </div>
      </div>
    </button>
  )
}
