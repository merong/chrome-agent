import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let tray: Tray | null = null
let currentStatus: 'connected' | 'disconnected' | 'error' = 'disconnected'

// Base64 encoded 16x16 PNG icons (simple circle icons)
const ICONS = {
  // Gray circle for disconnected
  disconnected:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVQ4T2NkoBAwUqifYdQAhtFwAA8HdDAGqL4OFHgMDOgYmBoIDsC8gJqjgGJgSAsBFBuoaQC6zeg2kGUAwwg0gOQoGIEG4HMBLrmhbQAxiUhpWqBKIqJB8gIAGewPEQkSeowAAAAASUVORK5CYII=',
  // Green circle for connected
  connected:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWklEQVQ4T2NkoBAwUqifYdQAhtFwAA8HdDAGmL4OtOAxUNUDsICAcoBZAbVHAc2GINkGdJvRbSDLAIYRaADJUTACDcDnAlxyQ9sAYhKR0rRAk0REg+QFAGF2FhE9yJtYAAAAAElFTkSuQmCC',
  // Red circle for error
  error:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWklEQVQ4T2NkoBAwUqifYdQAhtFwAA8HdDAGmP4OFDwGKn8AlAMUHQANA5QCSA5AtwXdBrIMYBiBBpAcBSPQAHwuoJkB1EhE1EhLVElENEheABAbBSPQAABDvxYREEfV5wAAAABJRU5ErkJggg=='
}

function createTrayIcon(status: 'connected' | 'disconnected' | 'error'): Electron.NativeImage {
  // Try to load from resources first
  const iconPath = join(__dirname, '../../resources/icon.png')
  if (existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath)
    if (!icon.isEmpty()) {
      return icon.resize({ width: 16, height: 16 })
    }
  }

  // Fall back to base64 icons
  const dataUrl = ICONS[status]
  const icon = nativeImage.createFromDataURL(dataUrl)
  return icon.resize({ width: 16, height: 16 })
}

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = createTrayIcon('disconnected')
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Chrome Agent',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    {
      label: 'Hide',
      click: () => {
        mainWindow.hide()
      }
    },
    { type: 'separator' },
    {
      label: 'Connection Status',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Chrome Agent')
  tray.setContextMenu(contextMenu)

  // Click to show window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

export function updateTrayStatus(status: 'connected' | 'disconnected' | 'error'): void {
  if (!tray) return

  currentStatus = status

  const statusText = {
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error'
  }[status]

  // Update icon based on status
  const icon = createTrayIcon(status)
  tray.setImage(icon)

  tray.setToolTip(`Chrome Agent - ${statusText}`)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
