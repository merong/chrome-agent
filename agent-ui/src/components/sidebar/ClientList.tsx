import type { Client } from '@/types'
import { ClientItem } from './ClientItem'
import { useClientStore } from '@/stores/clientStore'

interface ClientListProps {
  clients: Client[]
  selectedClientId: string | null
}

export function ClientList({ clients, selectedClientId }: ClientListProps): React.ReactElement {
  const { selectClient } = useClientStore()

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-foreground-muted">No clients connected</p>
        <p className="text-xs text-foreground-muted mt-1">
          Connect a Chrome Extension to get started
        </p>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1">
      {clients.map((client) => (
        <ClientItem
          key={client.id}
          client={client}
          isSelected={client.id === selectedClientId}
          onSelect={() => selectClient(client.id)}
        />
      ))}
    </div>
  )
}
