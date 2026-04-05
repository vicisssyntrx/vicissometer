import { supabase } from './supabase.js'

// ---- Auth User ID (set by main.js after login) ----
let _uid = null

export function setCurrentUser(userId) {
  _uid = userId
}

function uid() {
  if (!_uid) throw new Error('User not authenticated')
  return _uid
}

// ---- Default data ----

export const DEFAULT_HABITS = [
  { name: 'Workout',                  icon: '🏋️', life_outcome: 'Physically Strong', life_outcome_icon: '💪', weight: 25.0, sort_order: 0 },
  { name: 'Meditation',               icon: '🧘', life_outcome: 'Mentally Stable',   life_outcome_icon: '🧠', weight: 25.0, sort_order: 1 },
  { name: 'Reading',                  icon: '📖', life_outcome: 'Knowledge',          life_outcome_icon: '🌱', weight: 25.0, sort_order: 2 },
  { name: 'NO temporarily pleasures', icon: '🚫', life_outcome: 'Discipline',         life_outcome_icon: '🌸', weight: 25.0, sort_order: 3 },
]

export const DEFAULT_SETTINGS = {
  fontScale:     1.0,
  theme:         'auto',       // light | dark | auto
  bgOpacity:     100,
  cardOpacity:   88,
  cardBg:        '',           // Empty means follow theme default
  primaryText:   '',           // Empty means follow theme default
  secondaryText: '',           // Empty means follow theme default
  accentColor:   '#8B5CF6',
  bgType:        'gradient',
  bgValue:       '',           // Empty means follow theme default
  startDate:     '2024-12-24',
  targetDate:    '2025-12-25',
  customQuotes:  '["The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb]\n["It does not matter how slowly you go as long as you do not stop." - Confucius]\n["Everything you can imagine is real." - Pablo Picasso]',
}

// ---- Profile ----

export async function getOrCreateProfile() {
  const userId = uid()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  // First run — create profile + seed default habits
  const newProfile = {
    id: userId,
    username: 'Viciss_Syntrx',
    start_date: DEFAULT_SETTINGS.startDate,
    target_date: DEFAULT_SETTINGS.targetDate,
    coins:    0,
    streak:   0,
    settings: DEFAULT_SETTINGS,
  }

  const { data: created, error: e2 } = await supabase
    .from('profiles')
    .upsert(newProfile, { onConflict: 'id' })
    .select()
    .single()

  if (e2) throw e2

  await seedDefaultHabits()
  return created
}

export async function updateProfile(updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', uid())
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
    .eq('user_id', uid())
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function seedDefaultHabits() {
  const existing = await getHabits()
  if (existing.length > 0) return existing

  const toInsert = DEFAULT_HABITS.map(h => ({ ...h, user_id: uid(), active: true }))
  const { data, error } = await supabase.from('habits').insert(toInsert).select()
  if (error) throw error
  return data
}

export async function addHabit(habit) {
  const { data, error } = await supabase
    .from('habits')
    .insert({ ...habit, user_id: uid() })
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
    .eq('user_id', uid())
  if (error) throw error
}

export async function deleteHabit(id) {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', uid())
  if (error) throw error
}

// ---- Daily Progress ----

export async function getDailyProgressForDate(date) {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', uid())
    .eq('date', date)
  if (error) throw error
  return data || []
}

export async function getAllProgress() {
  const { data, error } = await supabase
    .from('daily_progress')
    .select('*')
    .eq('user_id', uid())
    .order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function saveDailyProgress(date, states) {
  const rows = Object.entries(states).map(([habit_id, completed]) => ({
    user_id: uid(),
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
    .eq('user_id', uid())
    .eq('date', date)
  if (error) throw error
}

// ---- Realtime ----

export function subscribeToProgress(callback) {
  const channel = supabase.channel('daily_progress_changes')
  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'daily_progress',
      filter: `user_id=eq.${uid()}`,
    }, callback)
    .subscribe()
  return channel
}

export function subscribeToHabits(callback) {
  const channel = supabase.channel('habits_changes')
  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'habits',
      filter: `user_id=eq.${uid()}`,
    }, callback)
    .subscribe()
  return channel
}
