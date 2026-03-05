import { useState } from 'react'
import './PasswordGate.css'

const STORAGE_KEY = 'centraliep_unlocked'

export function getPasswordUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setPasswordUnlocked() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {}
}

export function PasswordGate({ expectedPassword, onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (password.trim() === '') {
      setError('Entrez le mot de passe.')
      return
    }
    if (password === expectedPassword) {
      setPasswordUnlocked()
      onSuccess()
    } else {
      setError('Mot de passe incorrect.')
      setPassword('')
    }
  }

  return (
    <div className="password-gate">
      <div className="password-gate-box">
        <h1 className="password-gate-title">Central IEP</h1>
        <p className="password-gate-subtitle">Accès protégé</p>
        <form onSubmit={handleSubmit} className="password-gate-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="password-gate-input"
            autoFocus
            autoComplete="current-password"
            aria-label="Mot de passe"
          />
          {error && <p className="password-gate-error" role="alert">{error}</p>}
          <button type="submit" className="password-gate-btn">Accéder</button>
        </form>
      </div>
    </div>
  )
}
