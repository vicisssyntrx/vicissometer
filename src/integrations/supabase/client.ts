import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Limit concurrent HTTP/2 streams to prevent Chrome Linux from killing
// the connection when auth + data queries fire simultaneously on load.
const MAX_CONCURRENT = 2;
let activeRequests = 0;
const queue: Array<() => void> = [];

const processQueue = () => {
  while (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  }
};

const queuedFetch = (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const execute = () => {
      activeRequests++;
      fetch(url, { ...options, cache: 'no-store' })
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequests--;
          processQueue();
        });
    };

    if (activeRequests < MAX_CONCURRENT) {
      execute();
    } else {
      queue.push(execute);
    }
  });
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: queuedFetch,
  },
});
