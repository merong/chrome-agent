import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { ServerSettings } from './ServerSettings'
import { UISettings } from './UISettings'
import { NotificationSettings } from './NotificationSettings'
import { ShortcutSettings } from './ShortcutSettings'

type SettingsTab = 'server' | 'ui' | 'notifications' | 'shortcuts' | 'about'

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'server', label: 'Server' },
  { id: 'ui', label: 'UI' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'about', label: 'About' }
]

export function SettingsDialog(): React.ReactElement | null {
  const { settingsOpen, setSettingsOpen } = useUIStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('server')

  if (!settingsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative w-[700px] max-h-[80vh] bg-background rounded-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 rounded hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <nav className="w-48 border-r border-border p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-background-secondary text-foreground-secondary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'server' && <ServerSettings />}
            {activeTab === 'ui' && <UISettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'shortcuts' && <ShortcutSettings />}
            {activeTab === 'about' && <AboutPlaceholder />}
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutPlaceholder() {
  return (
    <div>
      <h3 className="text-lg font-medium text-foreground mb-4">About</h3>
      <div className="space-y-2 text-sm">
        <p><span className="text-foreground-secondary">Name:</span> Chrome Agent</p>
        <p><span className="text-foreground-secondary">Version:</span> 1.0.0</p>
        <p><span className="text-foreground-secondary">Description:</span> AI-powered browser automation</p>
      </div>
    </div>
  )
}
