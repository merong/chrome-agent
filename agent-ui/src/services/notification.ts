import { useSettingsStore } from '@/stores/settingsStore'

export type NotificationType = 'connection' | 'command' | 'error' | 'info'

interface NotificationOptions {
  type?: NotificationType
  sound?: boolean
}

class NotificationService {
  private supported = false

  async init(): Promise<void> {
    this.supported = (await window.electronAPI?.notification?.isSupported()) ?? false
  }

  private shouldNotify(type: NotificationType): boolean {
    const settings = useSettingsStore.getState().settings.notifications

    if (!settings.desktop) return false

    switch (type) {
      case 'connection':
        return settings.connectionStatus
      case 'command':
        return settings.commandComplete
      case 'error':
        return true // Always notify on errors
      case 'info':
      default:
        return true
    }
  }

  private shouldPlaySound(): boolean {
    return useSettingsStore.getState().settings.notifications.sound
  }

  show(title: string, body: string, options: NotificationOptions = {}): void {
    const type = options.type ?? 'info'

    if (!this.supported || !this.shouldNotify(type)) {
      return
    }

    const sound = options.sound ?? this.shouldPlaySound()
    window.electronAPI?.notification?.show(title, body, { sound })
  }

  // Convenience methods
  connectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    const messages: Record<string, { title: string; body: string }> = {
      connected: { title: 'Connected', body: 'Successfully connected to server' },
      disconnected: { title: 'Disconnected', body: 'Lost connection to server' },
      error: { title: 'Connection Error', body: 'Failed to connect to server' }
    }
    const msg = messages[status]
    if (msg) {
      this.show(msg.title, msg.body, { type: 'connection' })
    }
  }

  commandComplete(success: boolean, summary?: string): void {
    if (success) {
      this.show('Command Completed', summary ?? 'Command executed successfully', {
        type: 'command'
      })
    } else {
      this.show('Command Failed', summary ?? 'Command execution failed', {
        type: 'error'
      })
    }
  }

  error(title: string, message: string): void {
    this.show(title, message, { type: 'error' })
  }

  info(title: string, message: string): void {
    this.show(title, message, { type: 'info' })
  }
}

export const notificationService = new NotificationService()
