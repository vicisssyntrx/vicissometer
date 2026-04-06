import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://mozwojaslnofaepemuqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6CBL_OlZIY6ecKYdbhsJjg_gfigFZvN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function find() {
  const { data, error } = await supabase.from('habits').select('user_id').limit(1);
  if (error) console.error(error);
  else if (data && data.length > 0) console.log('FOUND:', data[0].user_id);
  else console.log('NOT FOUND');
}
find();
