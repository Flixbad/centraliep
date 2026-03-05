import { useState } from 'react'
import { useAuth } from '../lib/auth'
import styles from './AuthScreen.module.css'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        setMessage('Compte créé. Vérifiez votre email pour confirmer, puis connectez-vous.')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Central IEP</h1>
        <p className={styles.subtitle}>
          {isSignUp ? 'Créer un compte pour accéder à l’application' : 'Connectez-vous pour accéder à l’application'}
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder="••••••••"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.message}>{message}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Chargement…' : isSignUp ? 'Créer le compte' : 'Connexion'}
          </button>
        </form>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => { setIsSignUp((v) => !v); setError(''); setMessage('') }}
        >
          {isSignUp ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Créer un compte'}
        </button>
      </div>
    </div>
  )
}
