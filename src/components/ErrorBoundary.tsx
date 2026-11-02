import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-red-200 p-8 shadow">
            <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 mb-4">A runtime error occurred. Copy the details below and report it.</p>
            <pre className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-800 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700"
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
