import { supabase, getUserId } from './supabase.js'

const uid = getUserId()

// ---- Default habits to seed on first run ----
export const DEFAULT_HABITS = [
  { name: 'Workout', icon: '🏋️', life_outcome: 'Physically Strong', life_outcome_icon: '💪', weight: 25.0, sort_order: 0 },
  { name: 'Meditation', icon: '🧘', life_outcome: 'Mentally Stable', life_outcome_icon: '🧠', weight: 25.0, sort_order: 1 },
  { name: 'Reading', icon: '📖', life_outcome: 'Knowledge', life_outcome_icon: '🌱', weight: 25.0, sort_order: 2 },
  { name: 'NO temporarily pleasures', icon: '🚫', life_outcome: 'Discipline', life_outcome_icon: '🌸', weight: 25.0, sort_order: 3 },
]

export const DEFAULT_SETTINGS = {
  fontScale: 1.0,
  theme: 'light',
  bgOpacity: 100,
  cardOpacity: 88,
  cardBg: '#fff3e0',
  primaryText: '#1C0B00',
  secondaryText: '#7A4020',
  accentColor: '#8B5CF6',
  bgType: 'gradient',
  bgValue: '135deg, #2A1009 0%, #5C2D0C 45%, #3D1A08 100%',
  startDate: '2024-12-24',
  targetDate: '2025-12-25',
}

// ---- Profile ----

export async function getOrCreateProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()

  if (error) throw error

  if (data) return data

  // First run — create profile + seed habits
  const newProfile = {
    id: uid,
    username: 'Viciss_Syntrx',
    start_date: DEFAULT_SETTINGS.startDate,
    target_date: DEFAULT_SETTINGS.targetDate,
    coins: 0,
    streak: 0,
    settings: DEFAULT_SETTINGS,
  }

  const { data: created, error: e2 } = await supabase
    .from('profiles')
    .insert(newProfile)
    .select()
    .single()

  if (e2) throw e2

  // Seed default habits
  await seedDefaultHabits()

  return created
}

export async function updateProfile(updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', uid)
  if (error) throw error
}

export async function updateSettings(settings) {
  return updateProfile({ settings })
}

export async function updateCoinsAndStreak(coins, streak) {
  return updateProfile({ coins, streak })
}

// ---- Habits ----

export async function getHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', uid)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function seedDefaultHabits() {
  const existing = await getHabits()
  if (existing.length > 0) return existing

  const toInsert = DEFAULT_HABITS.map(h => ({ ...h, user_id: uid, active: true }))
  const { data, error } = await supabase.from('habits').insert(toInsert).select()
  if (error) throw error
  return data
}

export async function addHabit(habit) {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...habit, user_id: uid })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateHabit(id, updates) {
  const { error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .eq('user_id', uid)
  if (error) throw error
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', uid)
  if (error) throw error
}

export async function reorderHabits(orderedIds) {
  const updates = orderedIds.map((id, i) =>
    supabase.from('habits').update({ sort_order: i }).eq('id', id).eq('user_id', uid)
  )
  await Promise.all(updates)
}

// ---- Daily Progress ----

export async function getDailyProgressForDate(date) {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', uid)
    .eq('date', date)
  if (error) throw error
  return data || []
}

export async function getAllProgress() {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Upsert all habit completion states for a given date
 * @param {string} date
 * @param {Object} states { habitId: boolean }
 */
export async function saveDailyProgress(date, states) {
  const rows = Object.entries(states).map(([habit_id, completed]) => ({
    user_id: uid,
    date,
    habit_id,
    completed,
  }))

  const { error } = await supabase
    .from('daily_progress')
    .upsert(rows, { onConflict: 'user_id,date,habit_id' })

  if (error) throw error
}

export async function clearDailyProgress(date) {
  const { error } = await supabase
    .from('daily_progress')
    .delete()
    .eq('user_id', uid)
    .eq('date', date)
  if (error) throw error
}

/**
 * Count distinct dates with at least one completion
 */
export async function getCompletedDatesCount() {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('date')
    .eq('user_id', uid)
    .eq('completed', true)
  if (error) throw error
  const unique = new Set((data || []).map(r => r.date))
  return unique.size
}

// ---- Realtime subscriptions ----

export function subscribeToProgress(callback) {
  return supabase
    .channel('daily_progress_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'daily_progress',
      filter: `user_id=eq.${uid}`,
    }, callback)
    .subscribe()
}

export function subscribeToHabits(callback) {
  return supabase
    .channel('habits_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'habits',
      filter: `user_id=eq.${uid}`,
    }, callback)
    .subscribe()
}
