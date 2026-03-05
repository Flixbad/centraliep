import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

const STORAGE_KEY = 'centraliep_player_bases'
const STATUS_OPTIONS = ['En cours', 'Abandonné', 'Surveillance']

function getFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function usePlayerBases() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (hasSupabase()) {
      const fetchData = async () => {
        setLoading(true)
        const { data, error: e } = await supabase.from('player_bases').select('*').order('updated_at', { ascending: false })
        if (e) setError(e.message)
        else setList(data || [])
        setLoading(false)
      }
      const refetchInBackground = async () => {
        const { data, error: e } = await supabase.from('player_bases').select('*').order('updated_at', { ascending: false })
        if (!e && data) setList(data)
      }
      fetchData()

      const channel = supabase
        .channel('player_bases_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_bases' }, () => {
          fetchData()
        })
        .subscribe()

      const onVisible = () => {
        if (document.visibilityState === 'visible') refetchInBackground()
      }
      document.addEventListener('visibilitychange', onVisible)

      return () => {
        supabase.removeChannel(channel)
        document.removeEventListener('visibilitychange', onVisible)
      }
    } else {
      setList(getFromStorage())
      setLoading(false)
    }
  }, [])

  const add = async (row) => {
    const item = {
      membre: row.membre || '',
      nom_groupe: row.nom_groupe || '',
      coordonnees: row.coordonnees || '',
      status: row.status || 'En cours',
      notes: row.notes || '',
      region: row.region || null,
      type_base: row.type_base || null,
      dernier_contact: row.dernier_contact || null,
    }
    if (hasSupabase()) {
      const { data, error: e } = await supabase.from('player_bases').insert(item).select().single()
      if (e) setError(e.message)
      else if (data) setList((prev) => [data, ...prev])
    } else {
      const now = new Date().toISOString()
      const newItem = { ...item, id: crypto.randomUUID(), created_at: now, updated_at: now }
      const next = [newItem, ...list]
      setList(next)
      saveToStorage(next)
    }
  }

  const update = async (id, row) => {
    const payload = {
      membre: row.membre,
      nom_groupe: row.nom_groupe,
      coordonnees: row.coordonnees,
      status: row.status,
      notes: row.notes,
      region: row.region || null,
      type_base: row.type_base || null,
      dernier_contact: row.dernier_contact || null,
      updated_at: new Date().toISOString(),
    }
    if (hasSupabase()) {
      const { error: e } = await supabase.from('player_bases').update(payload).eq('id', id)
      if (e) setError(e.message)
      else setList((prev) => prev.map((x) => (x.id === id ? { ...x, ...payload } : x)))
    } else {
      const next = list.map((x) => (x.id === id ? { ...x, ...payload } : x))
      setList(next)
      saveToStorage(next)
    }
  }

  const remove = async (id) => {
    if (hasSupabase()) {
      const { error: e } = await supabase.from('player_bases').delete().eq('id', id)
      if (e) setError(e.message)
      else setList((prev) => prev.filter((x) => x.id !== id))
    } else {
      const next = list.filter((x) => x.id !== id)
      setList(next)
      saveToStorage(next)
    }
  }

  return { list, loading, error, add, update, remove, STATUS_OPTIONS }
}
