import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mozwojaslnofaepemuqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6CBL_OlZIY6ecKYdbhsJjg_gfigFZvN';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function backfill() {
  console.log('--- Starting Backfill ---');

  // 1. Identify User
  const { data: profile, error: pe } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'Viciss_Syntrx')
    .maybeSingle();

  if (pe || !profile) {
    console.error('User not found. Run the app once to create a profile.');
    if (pe) console.error(pe);
    return;
  }
  const uid = profile.id;
  console.log('User ID:', uid);

  // 2. Identify Habits
  const { data: habits, error: he } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', uid)
    .eq('active', true);

  if (he || !habits || !habits.length) {
    console.error('Active habits not found.');
    return;
  }
  console.log('Habit Count:', habits.length);

  // 3. Generate Dates
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

  console.log('Total Days to Backfill:', dates.length);

  // 4. Batch Construct Rows
  const rows = [];
  dates.forEach(date => {
    habits.forEach(h => {
      rows.push({
        user_id: uid,
        date: date,
        habit_id: h.id,
        completed: true
      });
    });
  });

  // 5. Upsert Progress
  console.log(`Upserting ${rows.length} records...`);
  // Supabase has a row limit per request, so let's chunk it.
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: ue } = await supabase
      .from('daily_progress')
      .upsert(chunk, { onConflict: 'user_id,date,habit_id' });
    if (ue) {
      console.error('Upsert failed at chunk', i, ue.message);
      return;
    }
  }

  // 6. Update Profile Stats
  // Starting Mudras: 10 per day * 73 days = 730
  // Starting Krama: 73
  console.log('Updating profile stats...');
  const { error: se } = await supabase
    .from('profiles')
    .update({ 
      coins: 730,  // Old column name
      streak: 73,  // Old column name
      updated_at: new Date().toISOString() 
    })
    .eq('id', uid);

  if (se) console.error('Stats update failed:', se.message);
  else console.log('??? Backfill Complete. 73 days, 730 Mudras, 73 Krama.');
}

backfill();
