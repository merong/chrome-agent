import { useClientStore } from '@/stores/clientStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { websocketService } from '@/services/websocket'
import { ChatContainer } from '../chat/ChatContainer'
import { EmptyState } from '../common/EmptyState'
import { Spinner } from '../common/Spinner'
import { Monitor, Plug, Chrome } from 'lucide-react'

export function MainContent(): React.ReactElement {
  const { status, lastError } = useConnectionStore()
  const { clients, selectedClientId } = useClientStore()
  const { settings } = useSettingsStore()
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const handleConnect = async () => {
    try {
      await websocketService.connect(settings.server.url)
      // Send CONNECT message after connection
      websocketService.send({
        messageId: `connect-${Date.now()}`,
        type: 'CONNECT',
        source: 'agent',
        target: 'server',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  // Disconnected state
  if (status === 'disconnected' || status === 'error') {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <EmptyState
          icon={Plug}
          title="Not Connected"
          description={lastError || "Connect to the server to start controlling browsers"}
          action={{
            label: 'Connect to Server',
            onClick: handleConnect
          }}
        />
      </main>
    )
  }

  // Connecting state
  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <Spinner size="lg" />
        <p className="text-foreground-secondary">
          {status === 'connecting' ? 'Connecting to server...' : 'Reconnecting...'}
        </p>
      </main>
    )
  }

  // Connected but no clients
  if (clients.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <EmptyState
          icon={Chrome}
          title="No Clients Connected"
          description="Install and connect the Chrome Extension to start"
        />
      </main>
    )
  }

  // Connected but no client selected
  if (!selectedClient) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background">
        <EmptyState
          icon={Monitor}
          title="Select a Client"
          description="Choose a client from the sidebar to start chatting"
        />
      </main>
    )
  }

  // Show chat for selected client
  return (
    <main className="flex-1 flex flex-col bg-background overflow-hidden">
      <ChatContainer client={selectedClient} />
    </main>
  )
}
