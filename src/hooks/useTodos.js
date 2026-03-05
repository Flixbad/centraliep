import { useState, useEffect } from 'react'
import { supabase, hasSupabase } from '../lib/supabase'

const STORAGE_KEY = 'centraliep_todos'
export const STADE_OPTIONS = ['Urgent', 'Moyen', 'Pas urgent']
export const TODO_STATUS_OPTIONS = ['À faire', 'En cours', 'Terminé']

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

export function useTodos() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (hasSupabase()) {
      const fetchData = async (isRetry = false) => {
        if (!isRetry) setLoading(true)
        const { data, error: e } = await supabase.from('todos').select('*').order('date', { ascending: true }).order('created_at', { ascending: false })
        if (import.meta.env.DEV) console.log('[CentralIEP] todos:', { count: (data || []).length, error: e?.message || null, retry: isRetry })
        if (e) setError(e.message)
        else setList(data || [])
        setLoading(false)
        return { data: data || [], error: e }
      }
      const refetchInBackground = async () => {
        const { data, error: e } = await supabase.from('todos').select('*').order('date', { ascending: true }).order('created_at', { ascending: false })
        if (!e && data) setList(data)
      }

      let retryId
      fetchData().then(({ data }) => {
        if (data && data.length === 0) {
          retryId = setTimeout(() => fetchData(true), 1200)
        }
      })

      const channel = supabase
        .channel('todos_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
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
      title: row.title || '',
      date: row.date || null,
      stade: row.stade || 'Moyen',
      status: row.status || 'À faire',
    }
    if (hasSupabase()) {
      const { data, error: e } = await supabase.from('todos').insert(item).select().single()
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
      title: row.title,
      date: row.date || null,
      stade: row.stade,
      status: row.status,
      updated_at: new Date().toISOString(),
    }
    if (hasSupabase()) {
      const { error: e } = await supabase.from('todos').update(payload).eq('id', id)
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
      const { error: e } = await supabase.from('todos').delete().eq('id', id)
      if (e) setError(e.message)
      else setList((prev) => prev.filter((x) => x.id !== id))
    } else {
      const next = list.filter((x) => x.id !== id)
      setList(next)
      saveToStorage(next)
    }
  }

  return { list, loading, error, add, update, remove, STADE_OPTIONS, TODO_STATUS_OPTIONS }
}
