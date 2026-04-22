import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Minimal fetch wrapper.
 * - keepalive:false  → prevents Chrome from holding dead H2 connections
 * - cache:'no-store' → bypasses the browser HTTP cache entirely
 * No URL mutation, no nonce — PostgREST rejects unknown query params.
 */
const customFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' });

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  },
});