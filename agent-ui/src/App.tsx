import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { SettingsDialog } from '@/components/settings/SettingsDialog'
import { ErrorBoundary, ToastContainer } from '@/components/common'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useGlobalShortcuts } from '@/hooks/useShortcuts'
import { useWebSocket } from '@/hooks/useWebSocket'
import { notificationService } from '@/services/notification'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1
    }
  }
})

function AppContent(): React.ReactElement {
  // Initialize WebSocket connection
  useWebSocket()

  // Initialize global shortcuts
  useGlobalShortcuts()

  // Initialize notification service
  useEffect(() => {
    notificationService.init()
  }, [])

  return (
    <>
      <AppLayout />
      <SettingsDialog />
      <ToastContainer />
    </>
  )
}

function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
