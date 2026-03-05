import { useState, useMemo } from 'react'
import { hasSupabase } from './lib/supabase'
import { useTheme } from './lib/theme.jsx'
import { PlayerBases } from './components/PlayerBases'
import { BannedPlayers } from './components/BannedPlayers'
import { Dashboard } from './components/Dashboard'
import { PasswordGate, getPasswordUnlocked } from './components/PasswordGate'
import './App.css'

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'bases', label: 'Bases joueurs' },
  { id: 'bans', label: 'Joueurs bannis' },
]

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || ''

function App() {
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState('dashboard')
  const hasPasswordProtection = APP_PASSWORD.length > 0
  const initialUnlocked = useMemo(() => !hasPasswordProtection || getPasswordUnlocked(), [hasPasswordProtection])
  const [unlocked, setUnlocked] = useState(initialUnlocked)

  if (hasPasswordProtection && !unlocked) {
    return (
      <PasswordGate
        expectedPassword={APP_PASSWORD}
        onSuccess={() => setUnlocked(true)}
      />
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1>Central IEP</h1>
          <div className="app-header-right">
            <div className="theme-switch">
              <span className="theme-label">Thème</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="theme-select"
                aria-label="Choisir le thème"
              >
                <option value="system">Système</option>
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
              </select>
            </div>
          </div>
        </div>
        <p className="tagline">Gestion des bases et des joueurs bannis</p>
      </header>

      {!hasSupabase() && (
        <div className="banner banner-info">
          <strong>Supabase non configuré.</strong> Les données restent sur cet appareil uniquement.
          <br />
          Définissez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans un fichier <code>.env</code> à la racine du projet (en local), ou dans les variables d’environnement du site Netlify, puis redémarrez le serveur de dev ou redéployez.
        </div>
      )}

      {hasSupabase() && (
        <div className="banner banner-sync">
          Les modifications sont synchronisées en temps réel.
        </div>
      )}

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'bases' && <PlayerBases />}
        {tab === 'bans' && <BannedPlayers />}
      </main>
    </div>
  )
}

export default App
