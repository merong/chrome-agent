import { format } from 'date-fns'

export type ExportFormat = 'json' | 'csv'

// Convert data to JSON string
export function toJSON(data: unknown, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0)
}

// Convert array of objects to CSV string
export function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''

  // Get all unique keys
  const keys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => keys.add(key))
  })
  const headers = Array.from(keys)

  // Build CSV
  const rows: string[] = []

  // Header row
  rows.push(headers.map(escapeCSV).join(','))

  // Data rows
  data.forEach((item) => {
    const row = headers.map((key) => {
      const value = item[key]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return escapeCSV(JSON.stringify(value))
      return escapeCSV(String(value))
    })
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

// Escape CSV value
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// Generate default filename
export function generateFilename(prefix: string, format: ExportFormat): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')
  return `${prefix}_${timestamp}.${format}`
}

// Export data to file
export async function exportToFile(
  data: unknown,
  exportFormat: ExportFormat,
  filenamePrefix: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filters =
      exportFormat === 'json'
        ? [{ name: 'JSON Files', extensions: ['json'] }]
        : [{ name: 'CSV Files', extensions: ['csv'] }]

    const result = await window.electronAPI?.file?.saveDialog({
      title: `Export as ${exportFormat.toUpperCase()}`,
      defaultPath: generateFilename(filenamePrefix, exportFormat),
      filters
    })

    if (result?.canceled || !result?.filePath) {
      return { success: false, error: 'Export cancelled' }
    }

    let content: string
    if (exportFormat === 'json') {
      content = toJSON(data)
    } else {
      // CSV requires array of objects
      const arrayData = Array.isArray(data) ? data : [data]
      content = toCSV(arrayData as Record<string, unknown>[])
    }

    const saveResult = await window.electronAPI?.file?.save(result.filePath, content)
    return saveResult || { success: false, error: 'Failed to save file' }
  } catch (error) {
    console.error('Export failed:', error)
    return { success: false, error: String(error) }
  }
}

// Flatten nested object for CSV export
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = value
    }
  }

  return result
}
