import { useEffect, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUIStore } from '@/stores/uiStore'

type ShortcutAction = 'sendMessage' | 'newConversation' | 'openSettings' | 'toggleLogPanel'

interface ShortcutHandler {
  action: ShortcutAction
  handler: () => void
}

// Parse shortcut string to key combination
function parseShortcut(shortcut: string): { key: string; ctrl: boolean; alt: boolean; shift: boolean; meta: boolean } {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]

  return {
    key: key === 'enter' ? 'enter' : key === ',' ? ',' : key,
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('cmd') || parts.includes('meta')
  }
}

// Check if keyboard event matches shortcut
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)
  const eventKey = event.key.toLowerCase()

  // Handle special keys
  const keyMatches =
    eventKey === parsed.key ||
    (parsed.key === 'enter' && eventKey === 'enter') ||
    (parsed.key === ',' && eventKey === ',')

  const modifiersMatch =
    event.ctrlKey === parsed.ctrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift &&
    (event.metaKey === parsed.meta || (parsed.ctrl && event.metaKey)) // Allow Cmd as Ctrl on Mac

  return keyMatches && modifiersMatch
}

// Hook for registering shortcuts
export function useShortcuts(handlers: ShortcutHandler[]): void {
  const { settings } = useSettingsStore()
  const { shortcuts } = settings

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields (unless it's Ctrl+Enter for send)
      const target = event.target as HTMLElement
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const { action, handler } of handlers) {
        const shortcut = shortcuts[action]
        if (shortcut && matchesShortcut(event, shortcut)) {
          // Allow sendMessage in input fields
          if (isInputField && action !== 'sendMessage') {
            continue
          }
          event.preventDefault()
          handler()
          return
        }
      }
    },
    [handlers, shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Hook for global app shortcuts (settings, log panel toggle)
export function useGlobalShortcuts(): void {
  const { setSettingsOpen, toggleLogPanel } = useUIStore()

  const handlers: ShortcutHandler[] = [
    {
      action: 'openSettings',
      handler: () => setSettingsOpen(true)
    },
    {
      action: 'toggleLogPanel',
      handler: toggleLogPanel
    }
  ]

  useShortcuts(handlers)
}

// Format shortcut for display (platform-aware)
export function formatShortcut(shortcut: string): string {
  const isMac = window.electronAPI?.platform === 'darwin'

  return shortcut
    .replace(/Ctrl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/Alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/Shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/Enter/gi, isMac ? '↵' : 'Enter')
    .replace(/\+/g, isMac ? '' : '+')
}
