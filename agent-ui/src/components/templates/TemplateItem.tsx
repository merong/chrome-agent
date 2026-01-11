import { useState } from 'react'
import { FileText, MoreVertical, Pencil, Trash2, Copy, Hash } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Template } from '@/types'

interface TemplateItemProps {
  template: Template
  onSelect: (template: Template) => void
  onEdit: (template: Template) => void
  onDelete: (template: Template) => void
}

export function TemplateItem({
  template,
  onSelect,
  onEdit,
  onDelete
}: TemplateItemProps): React.ReactElement {
  const [showMenu, setShowMenu] = useState(false)

  const handleSelect = () => {
    onSelect(template)
    setShowMenu(false)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(template)
    setShowMenu(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(template)
    setShowMenu(false)
  }

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg border border-border',
        'hover:bg-background-secondary cursor-pointer transition-colors'
      )}
      onClick={handleSelect}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-md">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {template.name}
          </h4>
          {template.description && (
            <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-background-secondary rounded text-xs text-foreground-secondary">
              <Hash className="w-3 h-3" />
              {template.category}
            </span>
            <span className="text-xs text-foreground-muted flex items-center gap-1">
              <Copy className="w-3 h-3" />
              {template.usageCount}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className={cn(
              'p-1 rounded transition-colors',
              'opacity-0 group-hover:opacity-100',
              'hover:bg-background text-foreground-muted hover:text-foreground'
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-background border border-border rounded-md shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-background-secondary"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-error hover:bg-background-secondary"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
