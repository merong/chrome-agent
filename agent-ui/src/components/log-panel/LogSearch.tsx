import { Search, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLogStore } from '@/stores/logStore'

export function LogSearch(): React.ReactElement {
  const { filter, setFilter } = useLogStore()

  return (
    <div className="relative flex-1">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
      <input
        type="text"
        value={filter.search || ''}
        onChange={(e) => setFilter({ search: e.target.value || undefined })}
        placeholder="Search logs..."
        className={cn(
          'w-full pl-7 pr-7 py-1 text-xs rounded border border-border bg-background',
          'placeholder:text-foreground-muted',
          'focus:outline-none focus:ring-1 focus:ring-ring'
        )}
      />
      {filter.search && (
        <button
          onClick={() => setFilter({ search: undefined })}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
