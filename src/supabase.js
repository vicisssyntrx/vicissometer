import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://semfpdnhpifcohqonzqz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlbWZwZG5ocGlmY29ocW9uenF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTUyNTUsImV4cCI6MjA5MTA3MTI1NX0.23q3rEFuEWCjxTicSaW8bXvUJZEI5VM2WmkWbmGTttA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: { params: { eventsPerSecond: 10 } }
})

// ---- Auth Helpers ----

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
