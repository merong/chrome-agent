import { useEffect, useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import { TemplateItem } from './TemplateItem'
import { TemplateDialog } from './TemplateDialog'
import { cn } from '@/utils/cn'
import type { Template } from '@/types'

interface TemplateListProps {
  onSelectTemplate: (content: string) => void
  onClose?: () => void
}

export function TemplateList({ onSelectTemplate, onClose }: TemplateListProps): React.ReactElement {
  const {
    templates,
    categories,
    selectedCategory,
    isLoading,
    loadTemplates,
    loadCategories,
    setSelectedCategory,
    useTemplate,
    deleteTemplate
  } = useTemplateStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    loadTemplates()
    loadCategories()
  }, [loadTemplates, loadCategories])

  const handleSelectTemplate = async (template: Template) => {
    const content = await useTemplate(template.id)
    if (content) {
      onSelectTemplate(content)
      onClose?.()
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleDelete = async (template: Template) => {
    if (window.confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
      await deleteTemplate(template.id)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTemplate(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Templates</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors',
            selectedCategory === null
              ? 'bg-primary text-white'
              : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-3 py-1 rounded-full text-xs whitespace-nowrap capitalize transition-colors',
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-background-secondary text-foreground-secondary hover:text-foreground'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-foreground-muted">
            Loading...
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-foreground-muted">
            <FolderOpen className="w-8 h-8 mb-2" />
            <p className="text-sm">No templates yet</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="mt-2 text-primary text-sm hover:underline"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <TemplateDialog
          template={editingTemplate}
          onClose={handleDialogClose}
        />
      )}
    </div>
  )
}
