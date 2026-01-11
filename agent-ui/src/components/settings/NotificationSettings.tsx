import { Bell, Volume2, Wifi, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useSettingsStore } from '@/stores/settingsStore'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary/50',
        disabled && 'opacity-50 cursor-not-allowed',
        checked ? 'bg-primary' : 'bg-foreground-muted/30'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

interface SettingRowProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function SettingRow({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled
}: SettingRowProps): React.ReactElement {
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
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

export function NotificationSettings(): React.ReactElement {
  const { settings, updateNotificationSettings } = useSettingsStore()
  const { notifications } = settings

  return (
    <div>
      <h3 className="text-lg font-medium text-foreground mb-4">Notifications</h3>
      <p className="text-sm text-foreground-muted mb-6">
        Configure how and when you receive notifications from Chrome Agent.
      </p>

      <div className="space-y-1 divide-y divide-border">
        <SettingRow
          icon={<Bell className="w-4 h-4" />}
          label="Desktop Notifications"
          description="Show system notifications for important events"
          checked={notifications.desktop}
          onChange={(checked) => updateNotificationSettings({ desktop: checked })}
        />

        <SettingRow
          icon={<Volume2 className="w-4 h-4" />}
          label="Sound"
          description="Play sound when notifications are shown"
          checked={notifications.sound}
          onChange={(checked) => updateNotificationSettings({ sound: checked })}
          disabled={!notifications.desktop}
        />

        <SettingRow
          icon={<Wifi className="w-4 h-4" />}
          label="Connection Status"
          description="Notify when connection status changes"
          checked={notifications.connectionStatus}
          onChange={(checked) => updateNotificationSettings({ connectionStatus: checked })}
          disabled={!notifications.desktop}
        />

        <SettingRow
          icon={<CheckCircle className="w-4 h-4" />}
          label="Command Complete"
          description="Notify when commands finish executing"
          checked={notifications.commandComplete}
          onChange={(checked) => updateNotificationSettings({ commandComplete: checked })}
          disabled={!notifications.desktop}
        />
      </div>

      <div className="mt-6 p-3 bg-background-secondary rounded-lg">
        <p className="text-xs text-foreground-muted">
          Note: Desktop notifications require system permissions. If you don&apos;t see
          notifications, check your system notification settings.
        </p>
      </div>
    </div>
  )
}
