import { useCallback } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { MainContent } from './MainContent'
import { LogPanel } from '../log-panel/LogPanel'
import { StatusBar } from './StatusBar'
import { ResizeHandle } from '../common/ResizeHandle'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const MIN_SIDEBAR_WIDTH = 150
const MAX_SIDEBAR_WIDTH = 400
const MIN_LOG_PANEL_WIDTH = 250
const MAX_LOG_PANEL_WIDTH = 600

export function AppLayout(): React.ReactElement {
  const { logPanelOpen, sidebarWidth, logPanelWidth, setSidebarWidth, setLogPanelWidth } =
    useUIStore()

  const handleSidebarResize = useCallback(
    (delta: number) => {
      setSidebarWidth(
        Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, sidebarWidth + delta))
      )
    },
    [sidebarWidth, setSidebarWidth]
  )

  const handleLogPanelResize = useCallback(
    (delta: number) => {
      // Note: delta is negative when dragging left (making panel bigger)
      setLogPanelWidth(
        Math.min(MAX_LOG_PANEL_WIDTH, Math.max(MIN_LOG_PANEL_WIDTH, logPanelWidth - delta))
      )
    },
    [logPanelWidth, setLogPanelWidth]
  )

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Client List */}
        <div
          className="flex-shrink-0 flex flex-col bg-background-secondary border-r border-border"
          style={{ width: sidebarWidth }}
        >
          <Sidebar />
        </div>

        {/* Sidebar Resize Handle */}
        <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />

        {/* Center - Chat/Main Content */}
        <MainContent />

        {/* Log Panel Resize Handle & Panel */}
        {logPanelOpen && (
          <>
            <ResizeHandle direction="horizontal" onResize={handleLogPanelResize} />
            <div
              className="flex-shrink-0 border-l border-border"
              style={{ width: logPanelWidth }}
            >
              <LogPanel />
            </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}
