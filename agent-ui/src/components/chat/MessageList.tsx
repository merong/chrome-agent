import { useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface MessageListProps {
  messages: ChatMessage[]
  isExecuting: boolean
}

export function MessageList({ messages, isExecuting }: MessageListProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isExecuting])

  if (messages.length === 0 && !isExecuting) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-foreground-secondary">No messages yet</p>
          <p className="text-sm text-foreground-muted mt-1">
            Start by sending a command to the browser
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Typing/Executing indicator */}
      {isExecuting && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
