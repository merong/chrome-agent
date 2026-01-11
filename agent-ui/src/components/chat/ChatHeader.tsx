import { Globe, ExternalLink } from 'lucide-react'
import { StatusIndicator } from '../common/StatusIndicator'
import type { Client } from '@/types'

interface ChatHeaderProps {
  client: Client
}

export function ChatHeader({ client }: ChatHeaderProps): React.ReactElement {
  const displayName = client.name || `Chrome #${client.id.slice(-4)}`

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
      <div className="flex items-center gap-3">
        {/* Client Name & Status */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold">{displayName}</h1>
            <StatusIndicator status={client.status} size="sm" showLabel />
          </div>

          {/* Current URL */}
          {client.metadata.currentUrl && (
            <div className="flex items-center gap-1 text-xs text-foreground-muted mt-0.5">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-md">{client.metadata.currentUrl}</span>
              <a
                href={client.metadata.currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
