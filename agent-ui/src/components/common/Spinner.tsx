import { cn } from '@/utils/cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10'
}

export function Spinner({ size = 'md', className }: SpinnerProps): React.ReactElement {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
