import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils/cn'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supportedLanguages, changeLanguage, type SupportedLanguage } from '@/i18n'

export function UISettings(): React.ReactElement {
  const { t } = useTranslation()
  const { settings, updateUISettings } = useSettingsStore()
  const { ui } = settings

  const handleLanguageChange = (lang: SupportedLanguage) => {
    updateUISettings({ language: lang })
    changeLanguage(lang)
  }

  const themes = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
    { id: 'system' as const, label: 'System', icon: Monitor }
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">UI Settings</h3>

      {/* Theme */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Theme</label>
        <div className="flex gap-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => updateUISettings({ theme: theme.id })}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md border transition-colors',
                ui.theme === theme.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-background-secondary'
              )}
            >
              <theme.icon className="w-4 h-4" />
              <span className="text-sm">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('settings.ui.language')}</label>
        <select
          value={ui.language}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className={cn(
            'w-full px-3 py-2 rounded-md border border-input bg-background',
            'text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Font Size</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            value={ui.fontSize}
            onChange={(e) =>
              updateUISettings({ fontSize: parseInt(e.target.value) })
            }
            min={12}
            max={18}
            className="flex-1"
          />
          <span className="text-sm text-foreground-secondary w-12">
            {ui.fontSize}px
          </span>
        </div>
      </div>

      {/* Sidebar Position */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Sidebar Position</label>
        <div className="flex gap-2">
          {(['left', 'right'] as const).map((position) => (
            <button
              key={position}
              onClick={() => updateUISettings({ sidebarPosition: position })}
              className={cn(
                'px-4 py-2 rounded-md border text-sm capitalize transition-colors',
                ui.sidebarPosition === position
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-background-secondary'
              )}
            >
              {position}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
