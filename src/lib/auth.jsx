import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase } from './supabase'

const ROLES_ORDER = ['Fondateur', 'SuperAdmin', 'Dev', 'Admin', 'Modérateur', 'Helpeur']
const ROLES_CAN_MANAGE_MEMBERS = ['Fondateur', 'SuperAdmin', 'Dev']
const ROLE_CAN_DELETE = (role) => role && role !== 'Helpeur'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  canDelete: () => false,
  canManageMembers: () => false,
  ROLES_ORDER,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)

  const fetchProfile = async (userId) => {
    if (!hasSupabase() || !userId) return null
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (!hasSupabase()) {
      setLoading(false)
      setSessionReady(true)
      return
    }

    const init = async () => {
      const timeout = setTimeout(() => {
        setLoading(false)
        setSessionReady(true)
      }, 3000)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const p = await fetchProfile(session.user.id)
          setProfile(p)
          setLoading(false)
          // Laisser le client Supabase appliquer la session avant les premiers fetches
          setTimeout(() => setSessionReady(true), 200)
        } else {
          setUser(null)
          setProfile(null)
          setSessionReady(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('Central IEP – Erreur auth:', err)
        setUser(null)
        setProfile(null)
        setSessionReady(true)
        setLoading(false)
      } finally {
        clearTimeout(timeout)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser(session.user)
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signUp = async (email, password) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : ''
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : {},
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const updateProfile = async (updates) => {
    if (!user?.id || !hasSupabase()) return
    const { error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id)
    if (error) throw error
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const canDelete = () => !hasSupabase() || (profile && ROLE_CAN_DELETE(profile.role))
  const canManageMembers = () => hasSupabase() && profile && ROLES_CAN_MANAGE_MEMBERS.includes(profile.role)

  const value = {
    user,
    profile,
    loading,
    sessionReady,
    signIn,
    signUp,
    signOut,
    updateProfile,
    canDelete,
    canManageMembers,
    ROLES_ORDER,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
