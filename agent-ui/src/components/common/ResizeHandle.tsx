import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

type ResizeDirection = 'horizontal' | 'vertical'

interface ResizeHandleProps {
  direction: ResizeDirection
  onResize: (delta: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
  minSize?: number
  maxSize?: number
  className?: string
}

export function ResizeHandle({
  direction,
  onResize,
  onResizeStart,
  onResizeEnd,
  className
}: ResizeHandleProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false)
  const startPosRef = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY
      onResizeStart?.()
    },
    [direction, onResizeStart]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
      const delta = currentPos - startPosRef.current
      startPosRef.current = currentPos
      onResize(delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onResizeEnd?.()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDragging, direction, onResize, onResizeEnd])

  const isHorizontal = direction === 'horizontal'

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-transparent hover:bg-primary/30 transition-colors',
        isHorizontal ? 'w-1 cursor-col-resize hover:w-1' : 'h-1 cursor-row-resize hover:h-1',
        isDragging && 'bg-primary/50',
        className
      )}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
    >
      <div
        className={cn(
          'absolute',
          isHorizontal
            ? 'top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize'
            : 'left-0 right-0 h-3 -translate-y-1/2 cursor-row-resize'
        )}
      />
    </div>
  )
}
