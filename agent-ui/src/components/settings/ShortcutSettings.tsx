import { useState } from 'react'
import { Command, MessageSquare, Settings, PanelRight, RefreshCcw } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatShortcut } from '@/hooks/useShortcuts'

interface ShortcutRowProps {
  icon: React.ReactNode
  label: string
  description: string
  shortcut: string
  onEdit: () => void
}

function ShortcutRow({
  icon,
  label,
  description,
  shortcut,
  onEdit
}: ShortcutRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background-secondary rounded-lg text-foreground-secondary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-foreground-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className={cn(
          'px-3 py-1.5 rounded-md text-xs font-mono',
          'bg-background-secondary border border-border',
          'hover:border-primary hover:text-primary transition-colors'
        )}
      >
        {formatShortcut(shortcut)}
      </button>
    </div>
  )
}

interface ShortcutEditorProps {
  label: string
  currentShortcut: string
  onSave: (shortcut: string) => void
  onCancel: () => void
}

function ShortcutEditor({
  label,
  currentShortcut,
  onSave,
  onCancel
}: ShortcutEditorProps): React.ReactElement {
  const [recording, setRecording] = useState(false)
  const [newShortcut, setNewShortcut] = useState(currentShortcut)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return

    e.preventDefault()
    e.stopPropagation()

    // Build shortcut string
    const parts: string[] = []
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')

    // Get the actual key
    let key = e.key
    if (key === ' ') key = 'Space'
    if (key.length === 1) key = key.toUpperCase()

    // Don't allow modifier-only shortcuts
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      return
    }

    parts.push(key)
    setNewShortcut(parts.join('+'))
    setRecording(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-xl p-6 w-80">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Edit Shortcut: {label}
        </h3>

        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onFocus={() => setRecording(true)}
          onBlur={() => setRecording(false)}
          className={cn(
            'p-4 rounded-md border-2 text-center font-mono cursor-pointer',
            'transition-colors mb-4',
            recording
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background-secondary text-foreground'
          )}
        >
          {recording ? (
            <span className="animate-pulse">Press keys...</span>
          ) : (
            formatShortcut(newShortcut)
          )}
        </div>

        <p className="text-xs text-foreground-muted mb-4">
          Click the box above and press your desired key combination.
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(newShortcut)}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShortcutSettings(): React.ReactElement {
  const { settings, updateShortcutSettings, resetToDefaults } = useSettingsStore()
  const { shortcuts } = settings

  const [editingShortcut, setEditingShortcut] = useState<{
    key: keyof typeof shortcuts
    label: string
  } | null>(null)

  const shortcutItems: Array<{
    key: keyof typeof shortcuts
    icon: React.ReactNode
    label: string
    description: string
  }> = [
    {
      key: 'sendMessage',
      icon: <MessageSquare className="w-4 h-4" />,
      label: 'Send Message',
      description: 'Send the current message'
    },
    {
      key: 'newConversation',
      icon: <Command className="w-4 h-4" />,
      label: 'New Conversation',
      description: 'Start a new conversation'
    },
    {
      key: 'openSettings',
      icon: <Settings className="w-4 h-4" />,
      label: 'Open Settings',
      description: 'Open the settings dialog'
    },
    {
      key: 'toggleLogPanel',
      icon: <PanelRight className="w-4 h-4" />,
      label: 'Toggle Log Panel',
      description: 'Show or hide the log panel'
    }
  ]

  const handleSave = (key: keyof typeof shortcuts, shortcut: string) => {
    updateShortcutSettings({ [key]: shortcut })
    setEditingShortcut(null)
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-foreground mb-4">Keyboard Shortcuts</h3>
      <p className="text-sm text-foreground-muted mb-6">
        Customize keyboard shortcuts for common actions. Click on a shortcut to edit it.
      </p>

      <div className="space-y-1 divide-y divide-border">
        {shortcutItems.map((item) => (
          <ShortcutRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            description={item.description}
            shortcut={shortcuts[item.key]}
            onEdit={() => setEditingShortcut({ key: item.key, label: item.label })}
          />
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset to Defaults
        </button>
      </div>

      {editingShortcut && (
        <ShortcutEditor
          label={editingShortcut.label}
          currentShortcut={shortcuts[editingShortcut.key]}
          onSave={(shortcut) => handleSave(editingShortcut.key, shortcut)}
          onCancel={() => setEditingShortcut(null)}
        />
      )}
    </div>
  )
}
