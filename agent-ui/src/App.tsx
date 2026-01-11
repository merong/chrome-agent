import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header, StatusBar } from '@/components/layout';
import { ChatArea, InputArea } from '@/components/chat';
import { ToastContainer } from '@/components/common';
import { useWebSocket } from '@/hooks/useWebSocket';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <StatusBar />
      <ChatArea />
      <InputArea />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
