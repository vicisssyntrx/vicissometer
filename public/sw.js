self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  
  // Bypass Supabase API requests completely. 
  // Intercepting them strips 'keepalive' flags and causes HTTP/2 protocol errors in Chrome.
  if (url.hostname.includes("supabase.co")) {
    return; // Fall back to native browser network handling
  }

  // Pass all other requests through to the network.
  event.respondWith(fetch(event.request));
});
