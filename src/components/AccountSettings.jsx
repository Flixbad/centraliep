import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import styles from './AccountSettings.module.css'

export function AccountSettings({ open, onClose }) {
  const { profile, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && profile) setDisplayName(profile.display_name || '')
  }, [open, profile])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await updateProfile({ display_name: displayName || null })
      onClose?.()
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Paramètres du compte</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Nom affiché
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre pseudo ou nom"
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Annuler</button>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
