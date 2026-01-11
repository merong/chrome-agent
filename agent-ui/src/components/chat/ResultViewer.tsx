import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, Copy, Check, Code, Table, Download } from 'lucide-react'
import { cn } from '@/utils/cn'
import { exportToFile, type ExportFormat } from '@/utils/export'
import { toast } from '@/stores/toastStore'

type ViewMode = 'tree' | 'raw' | 'table'

interface ResultViewerProps {
  data: unknown
  title?: string
  defaultExpanded?: boolean
}

// JSON Tree Node Component
interface JsonNodeProps {
  keyName: string | null
  value: unknown
  depth: number
  defaultExpanded?: boolean
}

function JsonNode({ keyName, value, depth, defaultExpanded = true }: JsonNodeProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < 2)

  const valueType = useMemo(() => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }, [value])

  const isExpandable = valueType === 'object' || valueType === 'array'
  const isEmpty = isExpandable && Object.keys(value as object).length === 0

  const renderValue = () => {
    if (valueType === 'null') {
      return <span className="text-foreground-muted italic">null</span>
    }
    if (valueType === 'undefined') {
      return <span className="text-foreground-muted italic">undefined</span>
    }
    if (valueType === 'boolean') {
      return <span className="text-warning">{String(value)}</span>
    }
    if (valueType === 'number') {
      return <span className="text-info">{String(value)}</span>
    }
    if (valueType === 'string') {
      const strValue = value as string
      // Truncate long strings
      const displayValue = strValue.length > 100 ? `${strValue.slice(0, 100)}...` : strValue
      return <span className="text-success">"{displayValue}"</span>
    }
    if (valueType === 'array') {
      const arr = value as unknown[]
      if (isEmpty) return <span className="text-foreground-muted">[]</span>
      return <span className="text-foreground-muted">[{arr.length}]</span>
    }
    if (valueType === 'object') {
      const obj = value as object
      if (isEmpty) return <span className="text-foreground-muted">{'{}'}</span>
      return <span className="text-foreground-muted">{'{...}'}</span>
    }
    return <span>{String(value)}</span>
  }

  const toggleExpand = useCallback(() => {
    if (isExpandable && !isEmpty) {
      setIsExpanded((prev) => !prev)
    }
  }, [isExpandable, isEmpty])

  return (
    <div className="font-mono text-xs">
      <div
        className={cn(
          'flex items-start gap-1 py-0.5',
          isExpandable && !isEmpty && 'cursor-pointer hover:bg-background-secondary rounded'
        )}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={toggleExpand}
      >
        {/* Expand/Collapse Arrow */}
        <span className="w-4 flex-shrink-0">
          {isExpandable && !isEmpty && (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-foreground-muted" />
            ) : (
              <ChevronRight className="w-3 h-3 text-foreground-muted" />
            )
          )}
        </span>

        {/* Key */}
        {keyName !== null && (
          <span className="text-primary">{keyName}: </span>
        )}

        {/* Value or Type Summary */}
        {(!isExpandable || !isExpanded || isEmpty) && renderValue()}
      </div>

      {/* Children */}
      {isExpandable && isExpanded && !isEmpty && (
        <div>
          {Object.entries(value as object).map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={valueType === 'array' ? `[${k}]` : k}
              value={v}
              depth={depth + 1}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Table View for Array Data
function TableView({ data }: { data: unknown[] }): React.ReactElement {
  if (data.length === 0) {
    return <div className="p-4 text-center text-foreground-muted text-sm">Empty array</div>
  }

  // Get all unique keys from objects
  const columns = useMemo(() => {
    const keys = new Set<string>()
    data.forEach((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach((key) => keys.add(key))
      }
    })
    return Array.from(keys)
  }, [data])

  // Check if data is suitable for table view (array of objects)
  const isTableable = columns.length > 0

  if (!isTableable) {
    return (
      <div className="p-4 text-center text-foreground-muted text-sm">
        Table view is not available for this data type
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-64">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-background-secondary">
            <th className="px-2 py-1 border-b border-border text-left text-foreground-secondary font-medium">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-2 py-1 border-b border-border text-left text-foreground-secondary font-medium"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-background-secondary">
              <td className="px-2 py-1 border-b border-border text-foreground-muted">{idx}</td>
              {columns.map((col) => {
                const value = row && typeof row === 'object' ? (row as Record<string, unknown>)[col] : undefined
                return (
                  <td key={col} className="px-2 py-1 border-b border-border text-foreground">
                    {value === undefined ? (
                      <span className="text-foreground-muted">-</span>
                    ) : typeof value === 'object' ? (
                      <span className="text-foreground-muted">{JSON.stringify(value)}</span>
                    ) : (
                      String(value)
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResultViewer({
  data,
  title = 'Result',
  defaultExpanded = true
}: ResultViewerProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [copied, setCopied] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExport = async (format: ExportFormat) => {
    setShowExportMenu(false)
    const result = await exportToFile(data, format, 'result')
    if (result.success) {
      toast.success('Export completed', `Data exported as ${format.toUpperCase()}`)
    } else if (result.error !== 'Export cancelled') {
      toast.error('Export failed', result.error)
    }
  }

  const dataString = useMemo(() => JSON.stringify(data, null, 2), [data])
  const isArray = Array.isArray(data)
  const itemCount = isArray ? data.length : typeof data === 'object' && data !== null ? Object.keys(data).length : 0

  return (
    <div className="bg-background rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-background-secondary border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>
              {title} {itemCount > 0 && `(${itemCount} ${isArray ? 'items' : 'keys'})`}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {isExpanded && (
            <div className="flex items-center gap-1 bg-background rounded border border-border">
              <button
                onClick={() => setViewMode('tree')}
                className={cn(
                  'p-1 rounded-l transition-colors',
                  viewMode === 'tree'
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground-muted hover:text-foreground'
                )}
                title="Tree View"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={cn(
                  'p-1 transition-colors',
                  viewMode === 'raw'
                    ? 'bg-primary/20 text-primary'
                    : 'text-foreground-muted hover:text-foreground'
                )}
                title="Raw JSON"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              {isArray && (
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1 rounded-r transition-colors',
                    viewMode === 'table'
                      ? 'bg-primary/20 text-primary'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                  title="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border rounded-md shadow-lg py-1 min-w-[100px]">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-background-secondary"
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-3 py-1.5 text-xs text-left text-foreground hover:bg-background-secondary"
                  >
                    CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-80 overflow-auto">
          {viewMode === 'tree' && (
            <div className="p-2">
              <JsonNode keyName={null} value={data} depth={0} defaultExpanded={true} />
            </div>
          )}
          {viewMode === 'raw' && (
            <pre className="p-3 text-xs overflow-x-auto">
              <code className="text-foreground">{dataString}</code>
            </pre>
          )}
          {viewMode === 'table' && isArray && <TableView data={data} />}
        </div>
      )}
    </div>
  )
}
