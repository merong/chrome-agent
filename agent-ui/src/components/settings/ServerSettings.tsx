import { useState } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils/cn'
import { websocketService, type ConnectionTestResult } from '@/services/websocket'
import { Loader2, CheckCircle2, XCircle, Wifi } from 'lucide-react'

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function ServerSettings(): React.ReactElement {
  const { settings, updateServerSettings } = useSettingsStore()
  const { server } = settings

  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const handleTestConnection = async () => {
    setTestStatus('testing')
    setTestResult(null)

    const result = await websocketService.testConnection(server.url)
    setTestResult(result)
    setTestStatus(result.success ? 'success' : 'error')

    // Reset status after 5 seconds
    setTimeout(() => {
      setTestStatus('idle')
    }, 5000)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Server Settings</h3>

      {/* Server URL with Test Button */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Server URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={server.url}
            onChange={(e) => updateServerSettings({ url: e.target.value })}
            className={cn(
              'flex-1 px-3 py-2 rounded-md border border-input bg-background',
              'text-sm focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            placeholder="ws://localhost:8080/ws"
          />
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              'border whitespace-nowrap',
              testStatus === 'idle' && 'border-border hover:bg-background-secondary',
              testStatus === 'testing' && 'border-border bg-background-secondary cursor-wait',
              testStatus === 'success' && 'border-green-500 bg-green-500/10 text-green-600',
              testStatus === 'error' && 'border-red-500 bg-red-500/10 text-red-600'
            )}
          >
            {testStatus === 'idle' && (
              <>
                <Wifi className="w-4 h-4" />
                Test
              </>
            )}
            {testStatus === 'testing' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            )}
            {testStatus === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Connected
              </>
            )}
            {testStatus === 'error' && (
              <>
                <XCircle className="w-4 h-4" />
                Failed
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-foreground-muted">
          WebSocket URL of the Chrome Agent server
        </p>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={cn(
              'mt-2 p-3 rounded-md text-sm',
              testResult.success
                ? 'bg-green-500/10 text-green-600 border border-green-500/30'
                : 'bg-red-500/10 text-red-600 border border-red-500/30'
            )}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Auto Connect */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">Auto Connect</label>
          <p className="text-xs text-foreground-muted">
            Automatically connect on startup
          </p>
        </div>
        <button
          onClick={() => updateServerSettings({ autoConnect: !server.autoConnect })}
          className={cn(
            'w-10 h-6 rounded-full transition-colors',
            server.autoConnect ? 'bg-primary' : 'bg-border'
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded-full bg-white transition-transform',
              server.autoConnect ? 'translate-x-5' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Reconnect Settings */}
      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium mb-4">Reconnect Settings</h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Max Retries */}
          <div className="space-y-2">
            <label className="text-sm">Max Retries</label>
            <input
              type="number"
              value={server.maxReconnectAttempts}
              onChange={(e) =>
                updateServerSettings({
                  maxReconnectAttempts: parseInt(e.target.value) || 5
                })
              }
              min={1}
              max={10}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-input bg-background',
                'text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>

          {/* Retry Interval */}
          <div className="space-y-2">
            <label className="text-sm">Retry Interval (seconds)</label>
            <input
              type="number"
              value={server.reconnectInterval}
              onChange={(e) =>
                updateServerSettings({
                  reconnectInterval: parseInt(e.target.value) || 5
                })
              }
              min={1}
              max={60}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-input bg-background',
                'text-sm focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>
        </div>
      </div>

      {/* Heartbeat Interval */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Heartbeat Interval (seconds)</label>
        <input
          type="number"
          value={server.heartbeatInterval}
          onChange={(e) =>
            updateServerSettings({
              heartbeatInterval: parseInt(e.target.value) || 10
            })
          }
          min={5}
          max={60}
          className={cn(
            'w-full px-3 py-2 rounded-md border border-input bg-background',
            'text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          )}
        />
        <p className="text-xs text-foreground-muted">
          Interval for sending heartbeat messages to keep connection alive
        </p>
      </div>
    </div>
  )
}
