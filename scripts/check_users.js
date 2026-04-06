import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://mozwojaslnofaepemuqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_6CBL_OlZIY6ecKYdbhsJjg_gfigFZvN';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
check();
