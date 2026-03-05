import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Central IEP – Erreur:', error, info)
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message || String(this.state.error)
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#0f1419',
          color: '#e6edf3',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem' }}>Une erreur s’est produite</h1>
          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#8b949e' }}>
            Le chargement de Central IEP a échoué. Rechargez la page (F5) ou réessayez plus tard.
          </p>
          <details style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            textAlign: 'left',
            fontSize: '0.85rem',
          }}>
            <summary style={{ cursor: 'pointer', color: '#8b949e' }}>Détails techniques</summary>
            <pre style={{ margin: '0.75rem 0 0', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg}
            </pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.2rem',
              background: '#58a6ff',
              color: '#0f1419',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
