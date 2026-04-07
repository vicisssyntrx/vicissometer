import { supabase } from './supabase.js'

// ---- Auth User ID (set by main.js after login) ----
let _uid = null

export function setCurrentUser(userId) {
  _uid = userId
}

function uid() {
  if (_uid) return _uid

  // Hard fallback for HMR (Hot Module Replacement) safety
  try {
    const raw = localStorage.getItem('sb-semfpdnhpifcohqonzqz-auth-token')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.user?.id) {
        _uid = parsed.user.id
        return _uid
      }
    }
  } catch (e) {}

  console.warn('uid() called before session loaded. Check setCurrentUser() call timing.')
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
  theme:         'auto',
  bgOpacity:     100,
  cardOpacity:   88,
  cardBg:        '',
  primaryText:   '',
  secondaryText: '',
  accentColor:   '#8B5CF6',
  bgType:        'gradient',
  bgValue:       '',
  startDate:     '2024-12-24',
  targetDate:    '2025-12-25',
  customQuotes:  '["The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb]\n["It does not matter how slowly you go as long as you do not stop." - Confucius]\n["Everything you can imagine is real." - Pablo Picasso]',
  mudras:        0,
  kramas:        0,
  kavachas:      0,
  urjas:         0
}

// ---- Profile ----

export async function getOrCreateProfile() {
  const userId = uid()
  if (!userId) {
    console.warn('Attempted to get profile without a user ID')
    return { ...DEFAULT_SETTINGS, id: 'temp', settings: DEFAULT_SETTINGS }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  
  if (!data) {
    console.warn('Profile missing from DB. Re-creating defensively...')
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        settings: DEFAULT_SETTINGS,
        mudras: 50
      })
      .select()
      .maybeSingle()
    
    // We no longer trigger default habits automatically here!

    return newProfile || { ...DEFAULT_SETTINGS, id: userId, mudras: 50, settings: DEFAULT_SETTINGS }
  }

  return data
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

// ---- Stats ----

export async function updateMudrasAndKramas(mudras, kramas) {
  return updateProfile({ mudras, kramas })
}

export async function updateGameStats(mudras, kramas, kavachas, urjas) {
  return updateProfile({ mudras, kramas, kavachas, urjas })
}

export async function purchaseKavacha(amount, totalCost) {
  const { data, error } = await supabase.rpc('purchase_kavacha', {
    amount,
    mudra_cost: totalCost
  })
  if (error) throw error
  return data
}

// ---- Backfill ----

export async function syncBackfillData(habits) {
  const userId = uid();
  const dates = [];
  const addRange = (start, end) => {
    let cur = new Date(start);
    const stop = new Date(end);
    while (cur <= stop) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
  };

  addRange('2024-12-24', '2025-02-21'); // 60 days
  addRange('2025-03-01', '2025-03-10'); // 10 days
  dates.push('2025-03-15', '2025-03-16', '2025-03-25'); // 3 days

  const rows = [];
  dates.forEach(date => {
    habits.forEach(h => {
      rows.push({ user_id: userId, date, habit_id: h.id, completed: true });
    });
  });

  const { error: ue } = await supabase.from('daily_progress').upsert(rows);
  if (ue) throw ue;

  // Let backend triggers handle Mudras! We just set Kramas manually if needed.
  // Although Krama isn't trigger-based yet, Mudras are.
  const kramas = 73;
  await updateProfile({ kramas });

  // Initial Ledger entry for backfill
  await addToLedger('KRAMA', 73, 'BACKFILL', 'Historic 73-day journey sync (Dec-Mar)');

  return { kramas };
}

export async function addToLedger(assetType, amount, eventType, description) {
  const { error } = await supabase
    .from('gamification_ledger')
    .insert({
      user_id: uid(),
      asset_type: assetType,
      change_amount: amount,
      event_type: eventType,
      description: description
    })
  if (error) console.error('Ledger entry failed:', error)
}



export async function getHabits() {
  const userId = uid()
  if (!userId) return [] // Graceful exit if not ready

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  
  if (error) {
    console.warn('Failed to fetch habits:', error.message)
    return []
  }
  return data || []
}

// Helper: Create default habits for a user
export async function createDefaultHabits() {
  const userId = uid()
  if (!userId) throw new Error('User not authenticated')

  const habitsToCreate = DEFAULT_HABITS.map((h, i) => ({
    user_id: userId,
    name: h.name,
    icon: h.icon,
    life_outcome: h.life_outcome,
    life_outcome_icon: h.life_outcome_icon,
    weight: h.weight,
    sort_order: i,
    active: true
  }))

  const { data, error } = await supabase
    .from('habits')
    .insert(habitsToCreate)
    .select()
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
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
  const channel = supabase.channel(`daily_progress_changes_${Date.now()}_${Math.random()}`)
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
  const channel = supabase.channel(`habits_changes_${Date.now()}_${Math.random()}`)
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

export function subscribeToProfile(callback) {
  const channel = supabase.channel(`profile_changes_${Date.now()}_${Math.random()}`)
  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${uid()}`,
    }, callback)
    .subscribe()
  return channel
}
