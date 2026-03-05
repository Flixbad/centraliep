import { useState, useMemo } from 'react'
import { useTodos, STADE_OPTIONS, TODO_STATUS_OPTIONS } from '../hooks/useTodos'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './Tables.module.css'

const PAGE_SIZE = 25

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toInputDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().slice(0, 10)
}

export function Todos() {
  const { list, loading, error, add, update, remove, STADE_OPTIONS, TODO_STATUS_OPTIONS } = useTodos()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    date: '',
    stade: 'Moyen',
    status: 'À faire',
  })
  const [filterStade, setFilterStade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('asc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredAndSorted = useMemo(() => {
    let result = [...list]
    if (filterStade) result = result.filter((r) => r.stade === filterStade)
    if (filterStatus) result = result.filter((r) => r.status === filterStatus)
    result.sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp = typeof va === 'string' && typeof vb === 'string'
        ? (va || '').localeCompare(vb || '', 'fr')
        : (new Date(va) || 0) - (new Date(vb) || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [list, filterStade, filterStatus, sortKey, sortDir])

  const visibleList = useMemo(() => filteredAndSorted.slice(0, visibleCount), [filteredAndSorted, visibleCount])
  const hasMore = filteredAndSorted.length > visibleCount

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', date: '', stade: 'Moyen', status: 'À faire' })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      title: row.title || '',
      date: toInputDate(row.date),
      stade: row.stade || 'Moyen',
      status: row.status || 'À faire',
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, date: form.date || null }
    if (editing) update(editing.id, payload)
    else add(payload)
    setModalOpen(false)
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const th = (key, label) => (
    <th className={styles.sortableTh} onClick={() => handleSort(key)} title={`Trier par ${label}`}>
      {label}
      {sortKey === key && <span className={styles.sortIcon}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </th>
  )

  const stadeClass = (s) => {
    if (s === 'Urgent') return styles.tagUrgent
    if (s === 'Pas urgent') return styles.tagPasUrgent
    return styles.tag
  }

  const statusClass = (s) => {
    if (s === 'Terminé') return styles.statusEnCours
    if (s === 'En cours') return styles.statusSurveillance
    return styles.tag
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>À faire</h2>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnPrimary} onClick={openAdd}>+ Nouvelle tâche</button>
        </div>
      </div>

      <div className={styles.filters}>
        <select className={styles.filterSelect} value={filterStade} onChange={(e) => { setFilterStade(e.target.value); setVisibleCount(PAGE_SIZE) }}>
          <option value="">Tous les stades</option>
          {STADE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={styles.filterSelect} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE) }}>
          <option value="">Tous les statuts</option>
          {TODO_STATUS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Chargement…</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${styles.tableDesktop}`}>
              <thead>
                <tr>
                  {th('title', 'Titre')}
                  {th('date', 'Date')}
                  {th('stade', 'Stade')}
                  {th('status', 'Statut')}
                  <th className={styles.actions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 ? (
                  <tr><td colSpan={5} className={styles.empty}>{list.length === 0 ? 'Aucune tâche.' : 'Aucun résultat.'}</td></tr>
                ) : (
                  visibleList.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.title || '—'}</strong></td>
                      <td className={styles.dateCell}>{formatDate(row.date)}</td>
                      <td><span className={stadeClass(row.stade)}>{row.stade || '—'}</span></td>
                      <td><span className={statusClass(row.status)}>{row.status || '—'}</span></td>
                      <td className={styles.actions}>
                        <button type="button" className={styles.btnSm} onClick={() => openEdit(row)}>Modifier</button>
                        <button type="button" className={styles.btnDanger} onClick={() => setConfirmDelete({ open: true, id: row.id })}>Suppr.</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.cardsMobile}>
            {visibleList.length === 0 ? (
              <p className={styles.empty}>{list.length === 0 ? 'Aucune tâche.' : 'Aucun résultat.'}</p>
            ) : (
              visibleList.map((row) => (
                <div key={row.id} className={styles.card}>
                  <div className={styles.cardRow}>
                    <strong>{row.title || '—'}</strong>
                    <span className={stadeClass(row.stade)}>{row.stade}</span>
                  </div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Date</span> {formatDate(row.date)}</div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Statut</span> <span className={statusClass(row.status)}>{row.status}</span></div>
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.btnSm} onClick={() => openEdit(row)}>Modifier</button>
                    <button type="button" className={styles.btnDanger} onClick={() => setConfirmDelete({ open: true, id: row.id })}>Suppr.</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {hasMore && (
            <div className={styles.loadMoreWrap}>
              <button type="button" className={styles.btnLoadMore} onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Voir plus ({filteredAndSorted.length - visibleCount} restants)
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        title="Supprimer cette tâche ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onConfirm={() => { if (confirmDelete.id) remove(confirmDelete.id); setConfirmDelete({ open: false, id: null }) }}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />

      {modalOpen && (
        <div className={styles.overlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Modifier la tâche' : 'Nouvelle tâche'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Titre * <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Description de la tâche" required /></label>
              <label>Date <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></label>
              <label>Stade <select value={form.stade} onChange={(e) => setForm((f) => ({ ...f, stade: e.target.value }))}>
                {STADE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></label>
              <label>Statut <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {TODO_STATUS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></label>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className={styles.btnPrimary}>{editing ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
