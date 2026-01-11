import { User, Bot, AlertCircle, Info } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/utils/cn'
import type { ChatMessage } from '@/types'
import { ResultViewer } from './ResultViewer'

interface MessageBubbleProps {
  message: ChatMessage
}

const typeConfig = {
  user: {
    icon: User,
    align: 'right' as const,
    bgColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    iconBg: 'bg-primary'
  },
  ai: {
    icon: Bot,
    align: 'left' as const,
    bgColor: 'bg-background-secondary',
    textColor: 'text-foreground',
    iconBg: 'bg-background-tertiary'
  },
  system: {
    icon: Info,
    align: 'left' as const,
    bgColor: 'bg-info/10',
    textColor: 'text-info',
    iconBg: 'bg-info/20'
  },
  error: {
    icon: AlertCircle,
    align: 'left' as const,
    bgColor: 'bg-error/10',
    textColor: 'text-error',
    iconBg: 'bg-error/20'
  }
}

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const config = typeConfig[message.type]
  const Icon = config.icon
  const isUser = message.type === 'user'

  return (
    <div
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          config.iconBg
        )}
      >
        <Icon className={cn('w-4 h-4', isUser ? 'text-primary-foreground' : 'text-foreground')} />
      </div>

      {/* Content */}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2',
          config.bgColor,
          config.textColor
        )}
      >
        {/* Message Text */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Result Data */}
        {message.data && (
          <div className="mt-2">
            <ResultViewer data={message.data} />
          </div>
        )}

        {/* Error Info */}
        {message.error && (
          <div className="mt-2 text-xs">
            <p className="font-medium">{message.error.code}</p>
            <p>{message.error.message}</p>
          </div>
        )}

        {/* Timestamp & Status */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 text-xs',
            isUser ? 'text-primary-foreground/70' : 'text-foreground-muted'
          )}
        >
          <span>{format(message.timestamp, 'HH:mm')}</span>
          {message.status && message.status !== 'success' && (
            <span className="capitalize">{message.status}</span>
          )}
        </div>
      </div>
    </div>
  )
}
