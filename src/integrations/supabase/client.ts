import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Proxy REST calls through Vercel edge to avoid HTTP/2 failures
// caused by ISP-level network equipment dropping direct connections
// to Supabase's US servers. Auth calls go direct (required for auth to work).
const proxyFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const urlStr = url.toString();
  const finalUrl = urlStr.includes('/rest/v1/')
    ? urlStr.replace(
        `${SUPABASE_URL}/rest/`,
        '/supabase-rest/'
      )
    : urlStr;

  return fetch(finalUrl, { ...options, cache: 'no-store' });
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: proxyFetch,
  },
});
