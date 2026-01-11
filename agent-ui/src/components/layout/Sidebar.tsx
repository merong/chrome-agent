import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useClientStore } from '@/stores/clientStore'
import { ClientList } from '../sidebar/ClientList'

export function Sidebar(): React.ReactElement {
  const { clients, selectedClientId } = useClientStore()

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
          Clients
        </h2>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-y-auto">
        <ClientList clients={clients} selectedClientId={selectedClientId} />
      </div>

      {/* Footer - Add Connection Button */}
      <div className="p-3 border-t border-border">
        <button
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2',
            'text-sm text-foreground-secondary',
            'rounded-md border border-dashed border-border',
            'hover:border-primary hover:text-primary transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>New Connection</span>
        </button>
      </div>
    </>
  )
}
