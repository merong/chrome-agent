import { type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8', className)}>
      <div className="w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-foreground-muted" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-foreground-secondary max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'mt-4 px-4 py-2 text-sm font-medium rounded-md',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
