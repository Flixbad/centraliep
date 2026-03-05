import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

const STORAGE_KEY = 'centraliep_banned_players'
export const INFRACTION_OPTIONS = ['Triche', 'Insulte', 'Vol', 'Abus', 'Autre']

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

export function useBannedPlayers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (hasSupabase()) {
      const fetchData = async (isRetry = false) => {
        if (!isRetry) setLoading(true)
        const { data, error: e } = await supabase.from('banned_players').select('*').order('date_ban', { ascending: false })
        if (e) setError(e.message)
        else setList(data || [])
        setLoading(false)
        return { data: data || [], error: e }
      }
      const refetchInBackground = async () => {
        const { data, error: e } = await supabase.from('banned_players').select('*').order('date_ban', { ascending: false })
        if (!e && data) setList(data)
      }

      let retryId
      fetchData().then(({ data }) => {
        if (data && data.length === 0) {
          retryId = setTimeout(() => fetchData(true), 1200)
        }
      })

      const channel = supabase
        .channel('banned_players_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'banned_players' }, () => {
          fetchData()
        })
        .subscribe()

      const onVisible = () => {
        if (document.visibilityState === 'visible') refetchInBackground()
      }
      document.addEventListener('visibilitychange', onVisible)

      return () => {
        if (retryId) clearTimeout(retryId)
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
      pseudo: row.pseudo || '',
      steamid: row.steamid || '',
      raison: row.raison || '',
      duree_ban: row.duree_ban || '',
      type_infraction: row.type_infraction || null,
      notes_supp: row.notes_supp || null,
    }
    if (hasSupabase()) {
      const { data, error: e } = await supabase.from('banned_players').insert(item).select().single()
      if (e) setError(e.message)
      else if (data) setList((prev) => [data, ...prev])
    } else {
      const newItem = { ...item, id: crypto.randomUUID(), date_ban: new Date().toISOString(), created_at: new Date().toISOString() }
      const next = [newItem, ...list]
      setList(next)
      saveToStorage(next)
    }
  }

  const update = async (id, row) => {
    const payload = {
      pseudo: row.pseudo,
      steamid: row.steamid,
      raison: row.raison,
      duree_ban: row.duree_ban || null,
      type_infraction: row.type_infraction || null,
      notes_supp: row.notes_supp || null,
    }
    if (hasSupabase()) {
      const { error: e } = await supabase.from('banned_players').update(payload).eq('id', id)
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
      const { error: e } = await supabase.from('banned_players').delete().eq('id', id)
      if (e) setError(e.message)
      else setList((prev) => prev.filter((x) => x.id !== id))
    } else {
      const next = list.filter((x) => x.id !== id)
      setList(next)
      saveToStorage(next)
    }
  }

  return { list, loading, error, add, update, remove }
}
