import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import styles from './UserMenu.module.css'

export function UserMenu({ onOpenSettings, onOpenMembers }) {
  const { user, profile, signOut, canManageMembers } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [open])

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Compte'
  const role = profile?.role || ''

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Menu compte"
      >
        <span className={styles.avatar} aria-hidden>
          {(displayName[0] || '?').toUpperCase()}
        </span>
        <span className={styles.name}>{displayName}</span>
        {role && <span className={styles.role}>{role}</span>}
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownEmail}>{user?.email}</span>
            {role && <span className={styles.dropdownRole}>{role}</span>}
          </div>
          <nav className={styles.dropdownNav}>
            <button type="button" className={styles.dropdownItem} onClick={() => { onOpenSettings?.(); setOpen(false) }}>
              Paramètres du compte
            </button>
            {canManageMembers() && (
              <button type="button" className={styles.dropdownItem} onClick={() => { onOpenMembers?.(); setOpen(false) }}>
                Gestion des membres
              </button>
            )}
            <button type="button" className={styles.dropdownItemDanger} onClick={() => { signOut(); setOpen(false) }}>
              Déconnexion
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
