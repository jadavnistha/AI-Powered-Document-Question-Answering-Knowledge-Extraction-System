import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <AlertTriangle size={28} className="text-danger mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="text-xl font-serif text-ink mb-1">Something went wrong</h1>
          <p className="text-sm text-ink-soft mb-5">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button className="btn-primary" onClick={() => window.location.assign('/dashboard')}>
            Reload
          </button>
        </div>
      </div>
    )
  }
}
