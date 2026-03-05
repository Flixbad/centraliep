import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const hasSupabase = () => !!supabase

if (import.meta.env.DEV) {
  console.log('[CentralIEP] Supabase:', supabase ? 'client OK' : 'désactivé (VITE_SUPABASE_* manquants)')
}
