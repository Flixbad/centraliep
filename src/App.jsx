import { useState } from 'react'
import { hasSupabase } from './lib/supabase'
import { useAuth } from './lib/auth.jsx'
import { useTheme } from './lib/theme.jsx'
import { PlayerBases } from './components/PlayerBases'
import { BannedPlayers } from './components/BannedPlayers'
import { Dashboard } from './components/Dashboard'
import { UserMenu } from './components/UserMenu'
import { MemberManagement } from './components/MemberManagement'
import { AccountSettings } from './components/AccountSettings'
import { AuthScreen } from './components/AuthScreen'
import './App.css'

const TABS_BASE = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'bases', label: 'Bases joueurs' },
  { id: 'bans', label: 'Joueurs bannis' },
]

function App() {
  const { user, loading: authLoading, sessionReady, canManageMembers } = useAuth()
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState('dashboard')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const tabs = [...TABS_BASE]
  if (canManageMembers()) {
    tabs.push({ id: 'members', label: 'Gestion des membres' })
  }

  const showAuthScreen = hasSupabase() && !user && !authLoading

  if (import.meta.env.DEV) {
    console.log('[CentralIEP] App state:', { hasSupabase: hasSupabase(), user: !!user, authLoading, sessionReady, showAuthScreen })
  }

  if ((authLoading && hasSupabase()) || (user && !sessionReady)) {
    return (
      <div className="app">
        <div className="app-loading">Chargement…</div>
      </div>
    )
  }

  if (showAuthScreen) {
    return (
      <div className="app">
        <header className="app-header app-header-minimal">
          <h1>Central IEP</h1>
        </header>
        <AuthScreen />
      </div>
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
            {user && (
              <UserMenu
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenMembers={() => setTab('members')}
              />
            )}
          </div>
        </div>
        <p className="tagline">Gestion des bases et des joueurs bannis</p>
      </header>

      {!hasSupabase() && (
        <div className="banner banner-info">
          <strong>Mode local.</strong> Les données sont enregistrées sur cet appareil uniquement.
          Configure Supabase + Auth pour la connexion et la synchronisation (voir README).
        </div>
      )}

      {hasSupabase() && user && (
        <div className="banner banner-sync">
          Connecté — les modifications sont synchronisées en temps réel.
        </div>
      )}

      <nav className="tabs">
        {tabs.map((t) => (
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
        {tab === 'members' && <MemberManagement />}
      </main>

      <AccountSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
