import { usePlayerBases } from '../hooks/usePlayerBases'
import { useBannedPlayers } from '../hooks/useBannedPlayers'
import { useTodos } from '../hooks/useTodos'
import styles from './Dashboard.module.css'

export function Dashboard() {
  const { list: bases } = usePlayerBases()
  const { list: bans } = useBannedPlayers()
  const { list: todos } = useTodos()

  const byStatus = {
    'En cours': bases.filter((b) => b.status === 'En cours').length,
    'Abandonné': bases.filter((b) => b.status === 'Abandonné').length,
    'Surveillance': bases.filter((b) => b.status === 'Surveillance').length,
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Tableau de bord</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardValue}>{bases.length}</span>
          <span className={styles.cardLabel}>Total bases</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{byStatus['En cours']}</span>
          <span className={styles.cardLabel}>En cours</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{byStatus['Abandonné']}</span>
          <span className={styles.cardLabel}>Abandonné</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{byStatus['Surveillance']}</span>
          <span className={styles.cardLabel}>Surveillance</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{bans.length}</span>
          <span className={styles.cardLabel}>Joueurs bannis</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{todos.length}</span>
          <span className={styles.cardLabel}>Tâches à faire</span>
        </div>
      </div>
    </section>
  )
}
