import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import styles from './MemberManagement.module.css'

export function MemberManagement() {
  const { ROLES_ORDER } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    if (!hasSupabase()) return
    const fetchProfiles = async () => {
      setLoading(true)
      const { data, error: e } = await supabase.from('profiles').select('id, email, display_name, role, created_at').order('created_at', { ascending: false })
      if (e) setError(e.message)
      else setList(data || [])
      setLoading(false)
    }
    fetchProfiles()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    if (!hasSupabase()) return
    setSavingId(userId)
    setError('')
    const { error: e } = await supabase.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId)
    if (e) setError(e.message)
    else setList((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)))
    setSavingId(null)
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (!hasSupabase()) {
    return (
      <section className={styles.section}>
        <p className={styles.muted}>Disponible avec Supabase configuré.</p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Gestion des membres</h2>
      <p className={styles.subtitle}>Attribuer ou modifier les rôles. Visible pour Fondateur, SuperAdmin et Dev.</p>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom affiché</th>
                <th>Rôle</th>
                <th>Inscrit le</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={5} className={styles.empty}>Aucun membre.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.email || '—'}</td>
                    <td>{row.display_name || '—'}</td>
                    <td><span className={styles.roleBadge}>{row.role}</span></td>
                    <td className={styles.dateCell}>{formatDate(row.created_at)}</td>
                    <td>
                      <select
                        className={styles.roleSelect}
                        value={row.role}
                        onChange={(e) => handleRoleChange(row.id, e.target.value)}
                        disabled={savingId === row.id}
                      >
                        {ROLES_ORDER.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {savingId === row.id && <span className={styles.saving}>Enregistrement…</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
