import { Bot } from 'lucide-react'
import { cn } from '@/utils/cn'

export function TypingIndicator(): React.ReactElement {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-background-tertiary">
        <Bot className="w-4 h-4 text-foreground" />
      </div>

      {/* Typing dots */}
      <div className="bg-background-secondary rounded-lg px-4 py-3">
        <div className="flex items-center gap-1">
          <div
            className={cn(
              'w-2 h-2 rounded-full bg-foreground-muted',
              'animate-bounce [animation-delay:-0.3s]'
            )}
          />
          <div
            className={cn(
              'w-2 h-2 rounded-full bg-foreground-muted',
              'animate-bounce [animation-delay:-0.15s]'
            )}
          />
          <div className={cn('w-2 h-2 rounded-full bg-foreground-muted', 'animate-bounce')} />
        </div>
      </div>
    </div>
  )
}
