import { useState, useRef, useEffect } from 'react'
import { Send, FileText, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useChatStore } from '@/stores/chatStore'
import { TemplateList } from '@/components/templates'
import type { ChatMessage } from '@/types'

interface InputAreaProps {
  clientId: string
  disabled?: boolean
}

export function InputArea({ clientId, disabled }: InputAreaProps): React.ReactElement {
  const [message, setMessage] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { addMessage, setCurrentExecution } = useChatStore()

  const handleSelectTemplate = (content: string) => {
    setMessage(content)
    setShowTemplates(false)
    textareaRef.current?.focus()
  }

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      clientId,
      type: 'user',
      content: trimmed,
      timestamp: new Date(),
      status: 'sending'
    }
    addMessage(clientId, userMessage)

    // Clear input
    setMessage('')

    // Set execution status
    setCurrentExecution({ isExecuting: true, currentStep: 'Processing...' })

    // TODO: Send via WebSocket
    // For now, simulate a response after a delay
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        clientId,
        type: 'ai',
        content: 'Command received. Processing...',
        timestamp: new Date(),
        status: 'success'
      }
      addMessage(clientId, aiMessage)
      setCurrentExecution({ isExecuting: false })
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative border-t border-border bg-background p-4">
      {/* Template Popup */}
      {showTemplates && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4">
          <div className="bg-background border border-border rounded-lg shadow-xl max-h-[400px] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-sm font-medium text-foreground">Select Template</span>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 rounded hover:bg-background-secondary text-foreground-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              <TemplateList
                onSelectTemplate={handleSelectTemplate}
                onClose={() => setShowTemplates(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Template Button */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={disabled}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'border border-border bg-background',
            'hover:bg-background-secondary transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            showTemplates && 'bg-background-secondary'
          )}
          title="Templates"
        >
          <FileText className="w-5 h-5 text-foreground-muted" />
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Enter a command... (Ctrl+Enter to send)"
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2',
            'text-sm placeholder:text-foreground-muted',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[40px] max-h-[150px]'
          )}
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
