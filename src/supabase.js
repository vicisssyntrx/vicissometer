import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mozwojaslnofaepemuqr.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_6CBL_OlZIY6ecKYdbhsJjg_gfigFZvN'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } }
})

// ---- User Identity (localStorage UUID) ----
const UID_KEY = 'vicissometer_uid'

export function getUserId() {
  let uid = localStorage.getItem(UID_KEY)
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem(UID_KEY, uid)
  }
  return uid
}
