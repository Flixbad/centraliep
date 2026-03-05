import { useState, useMemo } from 'react'
import { usePlayerBases } from '../hooks/usePlayerBases'
import { useAuth } from '../lib/auth'
import { downloadCsv, copyToClipboard } from '../lib/exportCsv'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './Tables.module.css'

const PAGE_SIZE = 25
const BASE_CSV_COLUMNS = [
  ['membre', 'Membre'],
  ['nom_groupe', 'Nom de groupe'],
  ['coordonnees', 'Coordonnées'],
  ['status', 'Statut'],
  ['region', 'Région'],
  ['type_base', 'Type de base'],
  ['notes', 'Notes'],
  ['created_at', 'Création'],
  ['updated_at', 'Dernière maj'],
  ['dernier_contact', 'Dernier contact'],
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function PlayerBases() {
  const { list, loading, error, add, update, remove, STATUS_OPTIONS } = usePlayerBases()
  const { canDelete } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    membre: '',
    nom_groupe: '',
    coordonnees: '',
    status: 'En cours',
    notes: '',
    region: '',
    type_base: '',
    dernier_contact: '',
  })
  const [filterSearch, setFilterSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState('updated_at')
  const [sortDir, setSortDir] = useState('desc')
  const [copiedId, setCopiedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredAndSorted = useMemo(() => {
    let result = [...list]
    const search = filterSearch.trim().toLowerCase()
    if (search) {
      result = result.filter(
        (r) =>
          (r.membre || '').toLowerCase().includes(search) ||
          (r.nom_groupe || '').toLowerCase().includes(search) ||
          (r.region || '').toLowerCase().includes(search) ||
          (r.type_base || '').toLowerCase().includes(search)
      )
    }
    if (filterStatus) result = result.filter((r) => r.status === filterStatus)
    result.sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp = typeof va === 'string' && typeof vb === 'string'
        ? va.localeCompare(vb, 'fr')
        : (new Date(va) || 0) - (new Date(vb) || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [list, filterSearch, filterStatus, sortKey, sortDir])

  const visibleList = useMemo(() => filteredAndSorted.slice(0, visibleCount), [filteredAndSorted, visibleCount])
  const hasMore = filteredAndSorted.length > visibleCount

  const openAdd = () => {
    setEditing(null)
    setForm({
      membre: '', nom_groupe: '', coordonnees: '', status: 'En cours', notes: '',
      region: '', type_base: '', dernier_contact: '',
    })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      membre: row.membre || '',
      nom_groupe: row.nom_groupe || '',
      coordonnees: row.coordonnees || '',
      status: row.status || 'En cours',
      notes: row.notes || '',
      region: row.region || '',
      type_base: row.type_base || '',
      dernier_contact: row.dernier_contact ? row.dernier_contact.slice(0, 10) : '',
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form, dernier_contact: form.dernier_contact || null }
    if (editing) update(editing.id, payload)
    else add(payload)
    setModalOpen(false)
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleExportCsv = () => {
    const forCsv = filteredAndSorted.map((r) => ({
      ...r,
      created_at: formatDate(r.created_at),
      updated_at: formatDate(r.updated_at),
      dernier_contact: formatDate(r.dernier_contact),
    }))
    downloadCsv(forCsv, `bases-joueurs-${new Date().toISOString().slice(0, 10)}`, BASE_CSV_COLUMNS)
  }

  const handleCopyCoords = async (id, text) => {
    if (!text || text === '—') return
    const ok = await copyToClipboard(text)
    if (ok) { setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) }
  }

  const statusClass = (s) => {
    if (s === 'En cours') return styles.statusEnCours
    if (s === 'Abandonné') return styles.statusAbandonne
    if (s === 'Surveillance') return styles.statusSurveillance
    return ''
  }

  const th = (key, label) => (
    <th className={styles.sortableTh} onClick={() => handleSort(key)} title={`Trier par ${label}`}>
      {label}
      {sortKey === key && <span className={styles.sortIcon}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </th>
  )

  const renderRow = (row) => (
    <tr key={row.id}>
      <td>{row.membre}</td>
      <td>{row.nom_groupe}</td>
      <td>
        <span className={styles.coordsCell}>
          <code className={styles.coords}>{row.coordonnees || '—'}</code>
          {row.coordonnees && (
            <button type="button" className={styles.copyBtn} onClick={() => handleCopyCoords(row.id, row.coordonnees)} title="Copier">
              {copiedId === row.id ? '✓ Copié' : 'Copier'}
            </button>
          )}
        </span>
      </td>
      <td><span className={statusClass(row.status)}>{row.status}</span></td>
      <td>{row.region || '—'}</td>
      <td>{row.type_base || '—'}</td>
      <td className={styles.dateCell}>{formatDate(row.dernier_contact) || '—'}</td>
      <td className={styles.dateCell}>{formatDate(row.updated_at)}</td>
      <td className={styles.notesCell}>{row.notes || '—'}</td>
      <td className={styles.actions}>
        <button type="button" className={styles.btnSm} onClick={() => openEdit(row)}>Modifier</button>
        {canDelete() && (
          <button type="button" className={styles.btnDanger} onClick={() => setConfirmDelete({ open: true, id: row.id })}>Suppr.</button>
        )}
      </td>
    </tr>
  )

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Bases joueurs</h2>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary} onClick={handleExportCsv} disabled={!list.length}>Exporter en CSV</button>
          <button type="button" className={styles.btnPrimary} onClick={openAdd}>+ Nouvelle base</button>
        </div>
      </div>

      <div className={styles.filters}>
        <input type="search" className={styles.searchInput} placeholder="Membre, groupe, région, type…" value={filterSearch} onChange={(e) => { setFilterSearch(e.target.value); setVisibleCount(PAGE_SIZE) }} />
        <select className={styles.filterSelect} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setVisibleCount(PAGE_SIZE) }}>
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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
                  {th('membre', 'Membre')}
                  {th('nom_groupe', 'Groupe')}
                  <th>Coordonnées</th>
                  {th('status', 'Statut')}
                  <th>Région</th>
                  <th>Type</th>
                  {th('dernier_contact', 'Dernier contact')}
                  {th('updated_at', 'Maj')}
                  <th>Notes</th>
                  <th className={styles.actions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 ? (
                  <tr><td colSpan={10} className={styles.empty}>{list.length === 0 ? 'Aucune base.' : 'Aucun résultat.'}</td></tr>
                ) : (
                  visibleList.map(renderRow)
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.cardsMobile}>
            {visibleList.length === 0 ? (
              <p className={styles.empty}>{list.length === 0 ? 'Aucune base.' : 'Aucun résultat.'}</p>
            ) : (
              visibleList.map((row) => (
                <div key={row.id} className={styles.card}>
                  <div className={styles.cardRow}>
                    <strong>{row.membre}</strong>
                    <span className={statusClass(row.status)}>{row.status}</span>
                  </div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Groupe</span> {row.nom_groupe}</div>
                  {row.coordonnees && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Coords</span>
                      <span className={styles.coordsCell}>
                        <code>{row.coordonnees}</code>
                        <button type="button" className={styles.copyBtn} onClick={() => handleCopyCoords(row.id, row.coordonnees)}>Copier</button>
                      </span>
                    </div>
                  )}
                  {(row.region || row.type_base) && (
                    <div className={styles.cardRow}><span className={styles.cardLabel}>Région / Type</span> {[row.region, row.type_base].filter(Boolean).join(' · ') || '—'}</div>
                  )}
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Dernier contact</span> {formatDate(row.dernier_contact) || '—'}</div>
                  {row.notes && <div className={styles.cardNotes}>{row.notes}</div>}
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.btnSm} onClick={() => openEdit(row)}>Modifier</button>
                    {canDelete() && (
                      <button type="button" className={styles.btnDanger} onClick={() => setConfirmDelete({ open: true, id: row.id })}>Suppr.</button>
                    )}
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
        title="Supprimer cette base ?"
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
            <h3>{editing ? 'Modifier la base' : 'Nouvelle base'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Membre * <input value={form.membre} onChange={(e) => setForm((f) => ({ ...f, membre: e.target.value }))} required /></label>
              <label>Nom de groupe * <input value={form.nom_groupe} onChange={(e) => setForm((f) => ({ ...f, nom_groupe: e.target.value }))} required /></label>
              <label>Coordonnées <input value={form.coordonnees} onChange={(e) => setForm((f) => ({ ...f, coordonnees: e.target.value }))} placeholder="ex: 1234, 5678" /></label>
              <label>Statut <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label>Région <input value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} placeholder="ex: Nord" /></label>
              <label>Type de base <input value={form.type_base} onChange={(e) => setForm((f) => ({ ...f, type_base: e.target.value }))} placeholder="ex: Forteresse" /></label>
              <label>Dernier contact <input type="date" value={form.dernier_contact} onChange={(e) => setForm((f) => ({ ...f, dernier_contact: e.target.value }))} /></label>
              <label>Notes <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} /></label>
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
