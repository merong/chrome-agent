import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-background">
          <div className="flex flex-col items-center max-w-md text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-sm text-foreground-secondary mb-4">
              예기치 않은 오류가 발생했습니다. 페이지를 새로고침하거나 아래 버튼을 클릭하여 다시 시도해 주세요.
            </p>
            {this.state.error && (
              <details className="w-full mb-4 text-left">
                <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground-secondary">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 p-3 bg-background-secondary rounded-md text-xs text-error overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
