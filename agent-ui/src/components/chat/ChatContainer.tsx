import { useMemo } from 'react'
import type { Client } from '@/types'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { useChatStore } from '@/stores/chatStore'

const EMPTY_MESSAGES: never[] = []

interface ChatContainerProps {
  client: Client
}

export function ChatContainer({ client }: ChatContainerProps): React.ReactElement {
  const messagesByClient = useChatStore((state) => state.messagesByClient)
  const currentExecution = useChatStore((state) => state.currentExecution)
  const messages = useMemo(
    () => messagesByClient[client.id] || EMPTY_MESSAGES,
    [messagesByClient, client.id]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader client={client} />

      {/* Messages */}
      <MessageList messages={messages} isExecuting={currentExecution.isExecuting} />

      {/* Input */}
      <InputArea clientId={client.id} disabled={currentExecution.isExecuting} />
    </div>
  )
}
