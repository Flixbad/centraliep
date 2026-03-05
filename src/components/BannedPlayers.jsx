import { useState, useMemo } from 'react'
import { useBannedPlayers, INFRACTION_OPTIONS } from '../hooks/useBannedPlayers'
import { downloadCsv } from '../lib/exportCsv'
import { ConfirmDialog } from './ConfirmDialog'
import styles from './Tables.module.css'

const PAGE_SIZE = 25
const BANNED_CSV_COLUMNS = [
  ['pseudo', 'Pseudo'],
  ['steamid', 'Steam ID'],
  ['raison', 'Raison'],
  ['type_infraction', 'Type infraction'],
  ['duree_ban', 'Durée du ban'],
  ['date_ban', 'Date du ban'],
  ['notes_supp', 'Notes supplémentaires'],
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function BannedPlayers() {
  const { list, loading, error, add, update, remove } = useBannedPlayers()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    pseudo: '', steamid: '', raison: '', duree_ban: '', type_infraction: '', notes_supp: '',
  })
  const [filterSearch, setFilterSearch] = useState('')
  const [filterInfraction, setFilterInfraction] = useState('')
  const [sortKey, setSortKey] = useState('date_ban')
  const [sortDir, setSortDir] = useState('desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredAndSorted = useMemo(() => {
    let result = [...list]
    const search = filterSearch.trim().toLowerCase()
    if (search) {
      result = result.filter(
        (r) =>
          (r.pseudo || '').toLowerCase().includes(search) ||
          (r.steamid || '').toLowerCase().includes(search)
      )
    }
    if (filterInfraction) result = result.filter((r) => r.type_infraction === filterInfraction)
    result.sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp = typeof va === 'string' && typeof vb === 'string'
        ? va.localeCompare(vb, 'fr')
        : (new Date(va) || 0) - (new Date(vb) || 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return result
  }, [list, filterSearch, filterInfraction, sortKey, sortDir])

  const visibleList = useMemo(() => filteredAndSorted.slice(0, visibleCount), [filteredAndSorted, visibleCount])
  const hasMore = filteredAndSorted.length > visibleCount

  const dataForCsv = useMemo(
    () => filteredAndSorted.map((r) => ({ ...r, date_ban: formatDate(r.date_ban) })),
    [filteredAndSorted]
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ pseudo: '', steamid: '', raison: '', duree_ban: '', type_infraction: '', notes_supp: '' })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      pseudo: row.pseudo || '',
      steamid: row.steamid || '',
      raison: row.raison || '',
      duree_ban: row.duree_ban || '',
      type_infraction: row.type_infraction || '',
      notes_supp: row.notes_supp || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) update(editing.id, form)
    else add(form)
    setModalOpen(false)
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleExportCsv = () => {
    downloadCsv(dataForCsv, `joueurs-bannis-${new Date().toISOString().slice(0, 10)}`, BANNED_CSV_COLUMNS)
  }

  const th = (key, label) => (
    <th className={styles.sortableTh} onClick={() => handleSort(key)} title={`Trier par ${label}`}>
      {label}
      {sortKey === key && <span className={styles.sortIcon}>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </th>
  )

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Joueurs bannis</h2>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnSecondary} onClick={handleExportCsv} disabled={!list.length}>Exporter en CSV</button>
          <button type="button" className={styles.btnPrimary} onClick={openAdd}>+ Nouveau ban</button>
        </div>
      </div>

      <div className={styles.filters}>
        <input type="search" className={styles.searchInput} placeholder="Pseudo ou Steam ID…" value={filterSearch} onChange={(e) => { setFilterSearch(e.target.value); setVisibleCount(PAGE_SIZE) }} />
        <select className={styles.filterSelect} value={filterInfraction} onChange={(e) => { setFilterInfraction(e.target.value); setVisibleCount(PAGE_SIZE) }}>
          <option value="">Tous les types</option>
          {INFRACTION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
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
                  {th('pseudo', 'Pseudo')}
                  {th('steamid', 'Steam ID')}
                  {th('raison', 'Raison')}
                  {th('type_infraction', 'Type')}
                  {th('duree_ban', 'Durée')}
                  {th('date_ban', 'Date')}
                  <th>Notes supp.</th>
                  <th className={styles.actions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 ? (
                  <tr><td colSpan={8} className={styles.empty}>{list.length === 0 ? 'Aucun joueur banni.' : 'Aucun résultat.'}</td></tr>
                ) : (
                  visibleList.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.pseudo}</strong></td>
                      <td><code className={styles.steamid}>{row.steamid}</code></td>
                      <td className={styles.notesCell}>{row.raison}</td>
                      <td>{row.type_infraction ? <span className={styles.tag}>{row.type_infraction}</span> : '—'}</td>
                      <td>{row.duree_ban || '—'}</td>
                      <td className={styles.dateCell}>{formatDate(row.date_ban)}</td>
                      <td className={styles.notesCell}>{row.notes_supp || '—'}</td>
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
              <p className={styles.empty}>{list.length === 0 ? 'Aucun joueur banni.' : 'Aucun résultat.'}</p>
            ) : (
              visibleList.map((row) => (
                <div key={row.id} className={styles.card}>
                  <div className={styles.cardRow}>
                    <strong>{row.pseudo}</strong>
                    {row.type_infraction && <span className={styles.tag}>{row.type_infraction}</span>}
                  </div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Steam ID</span> <code className={styles.steamid}>{row.steamid}</code></div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Raison</span> {row.raison}</div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Durée</span> {row.duree_ban || '—'}</div>
                  <div className={styles.cardRow}><span className={styles.cardLabel}>Date</span> {formatDate(row.date_ban)}</div>
                  {row.notes_supp && <div className={styles.cardNotes}>{row.notes_supp}</div>}
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
        title="Supprimer ce joueur banni ?"
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
            <h3>{editing ? 'Modifier le ban' : 'Nouveau joueur banni'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Pseudo * <input value={form.pseudo} onChange={(e) => setForm((f) => ({ ...f, pseudo: e.target.value }))} required /></label>
              <label>Steam ID * <input value={form.steamid} onChange={(e) => setForm((f) => ({ ...f, steamid: e.target.value }))} placeholder="ex: STEAM_0:1:12345678" required /></label>
              <label>Raison * <input value={form.raison} onChange={(e) => setForm((f) => ({ ...f, raison: e.target.value }))} required /></label>
              <label>Type d'infraction <select value={form.type_infraction} onChange={(e) => setForm((f) => ({ ...f, type_infraction: e.target.value }))}>
                <option value="">—</option>
                {INFRACTION_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select></label>
              <label>Durée du ban <input value={form.duree_ban} onChange={(e) => setForm((f) => ({ ...f, duree_ban: e.target.value }))} placeholder="ex: 7 jours, Permanent" /></label>
              <label>Notes supplémentaires <textarea value={form.notes_supp} onChange={(e) => setForm((f) => ({ ...f, notes_supp: e.target.value }))} rows={3} placeholder="Suivi, commentaires…" /></label>
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
