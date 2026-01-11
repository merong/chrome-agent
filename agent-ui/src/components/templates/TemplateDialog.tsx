import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import { cn } from '@/utils/cn'
import type { Template } from '@/types'

interface TemplateDialogProps {
  template: Template | null
  onClose: () => void
}

export function TemplateDialog({ template, onClose }: TemplateDialogProps): React.ReactElement {
  const { categories, addTemplate, updateTemplate } = useTemplateStore()

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = template !== null

  useEffect(() => {
    if (template) {
      setName(template.name)
      setContent(template.content)
      setDescription(template.description || '')
      setCategory(template.category)
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!content.trim()) {
      setError('Content is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing) {
        await updateTemplate(template.id, {
          name: name.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
          category
        })
      } else {
        await addTemplate({
          name: name.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
          category
        })
      }
      onClose()
    } catch (err) {
      setError('Failed to save template')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Template' : 'New Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2 bg-error/10 border border-error/20 rounded text-error text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className={cn(
                'w-full px-3 py-2 rounded-md border border-border',
                'bg-background text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
              )}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-border',
                'bg-background text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
              )}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className={cn(
                'w-full px-3 py-2 rounded-md border border-border',
                'bg-background text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
              )}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">
              Content <span className="text-error">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your command template..."
              rows={6}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-border',
                'bg-background text-foreground font-mono text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'resize-none'
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'px-4 py-2 bg-primary text-white rounded-md text-sm',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
