import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-sm text-gray-700 dark:text-gray-300">
          <p>Something went wrong.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
