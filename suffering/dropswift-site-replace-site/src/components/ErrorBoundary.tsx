import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<{children: ReactNode}, {err?: Error}> {
  state = { err: undefined as Error | undefined }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error) { console.error('Render error:', err) }
  render() {
    if (this.state.err) {
      return (
        <div style={{padding:24}}>
          <h2>Something went wrong.</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{this.state.err.message}</pre>
          <p>Open DevTools → Console for details.</p>
        </div>
      )
    }
    return this.props.children
  }
}
