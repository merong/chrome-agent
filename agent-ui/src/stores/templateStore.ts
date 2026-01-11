import { create } from 'zustand'
import type { Template } from '@/types'

interface TemplateState {
  templates: Template[]
  categories: string[]
  selectedCategory: string | null
  isLoading: boolean

  // Actions
  loadTemplates: (category?: string) => Promise<void>
  loadCategories: () => Promise<void>
  addTemplate: (template: Omit<Template, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTemplate: (id: string, updates: Partial<Pick<Template, 'name' | 'content' | 'description' | 'category'>>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  useTemplate: (id: string) => Promise<string | null>
  setSelectedCategory: (category: string | null) => void
}

// Convert DB record to Template
function dbRecordToTemplate(record: {
  id: string
  name: string
  content: string
  description: string | null
  category: string
  usage_count: number
  created_at: string
  updated_at: string
}): Template {
  return {
    id: record.id,
    name: record.name,
    content: record.content,
    description: record.description || undefined,
    category: record.category,
    usageCount: record.usage_count,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  categories: ['general', 'extraction', 'navigation', 'form', 'custom'],
  selectedCategory: null,
  isLoading: false,

  loadTemplates: async (category?: string) => {
    set({ isLoading: true })
    try {
      const records = await window.electronAPI?.db?.getTemplates(
        category ? { category } : undefined
      )
      if (records) {
        const templates = records.map(dbRecordToTemplate)
        set({ templates })
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  loadCategories: async () => {
    try {
      const categories = await window.electronAPI?.db?.getTemplateCategories()
      if (categories && categories.length > 0) {
        // Merge with default categories
        const defaultCategories = ['general', 'extraction', 'navigation', 'form', 'custom']
        const allCategories = [...new Set([...defaultCategories, ...categories])]
        set({ categories: allCategories })
      }
    } catch (error) {
      console.error('Failed to load template categories:', error)
    }
  },

  addTemplate: async (template) => {
    try {
      const id = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      await window.electronAPI?.db?.insertTemplate({
        id,
        name: template.name,
        content: template.content,
        description: template.description ?? null,
        category: template.category
      })
      // Reload templates
      await get().loadTemplates(get().selectedCategory || undefined)
    } catch (error) {
      console.error('Failed to add template:', error)
      throw error
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      await window.electronAPI?.db?.updateTemplate(id, {
        name: updates.name,
        content: updates.content,
        description: updates.description ?? undefined,
        category: updates.category
      })
      // Update local state
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
        )
      }))
    } catch (error) {
      console.error('Failed to update template:', error)
      throw error
    }
  },

  deleteTemplate: async (id) => {
    try {
      await window.electronAPI?.db?.deleteTemplate(id)
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id)
      }))
    } catch (error) {
      console.error('Failed to delete template:', error)
      throw error
    }
  },

  useTemplate: async (id) => {
    const template = get().templates.find((t) => t.id === id)
    if (!template) return null

    try {
      await window.electronAPI?.db?.incrementTemplateUsage(id)
      // Update local state
      set((state) => ({
        templates: state.templates.map((t) =>
          t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
        )
      }))
      return template.content
    } catch (error) {
      console.error('Failed to increment template usage:', error)
      return template.content
    }
  },

  setSelectedCategory: (category) => {
    set({ selectedCategory: category })
    get().loadTemplates(category || undefined)
  }
}))
