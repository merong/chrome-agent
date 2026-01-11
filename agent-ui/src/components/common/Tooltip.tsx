import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  position?: TooltipPosition
  delay?: number
  className?: string
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  className
}: TooltipProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const positionStyles: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-foreground border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-foreground border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-foreground border-t-transparent border-b-transparent border-l-transparent'
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-xs rounded-md',
            'bg-foreground text-background',
            'whitespace-nowrap shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            positionStyles[position],
            className
          )}
        >
          {content}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowStyles[position]
            )}
          />
        </div>
      )}
    </div>
  )
}
