import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const queryPath = req.query.path;
  const path = Array.isArray(queryPath) ? queryPath.join('/') : (queryPath || '');
  const search = new URL(req.url!, `https://${req.headers.host}`).search;
  const targetUrl = `${SUPABASE_URL}/rest/v1/${path}${search}`;

  // Only forward these headers — strip ALL cookies
  const forwardHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'apikey': process.env.VITE_SUPABASE_ANON_KEY!,
  };

  if (req.headers['authorization']) {
    forwardHeaders['authorization'] = req.headers['authorization'] as string;
  }
  if (req.headers['prefer']) {
    forwardHeaders['prefer'] = req.headers['prefer'] as string;
  }

  const body = req.method !== 'GET' && req.method !== 'HEAD'
    ? JSON.stringify(req.body)
    : undefined;

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: forwardHeaders,
    body,
  });

  const data = await upstream.text();
  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    if (!['transfer-encoding', 'connection'].includes(key)) {
      res.setHeader(key, value);
    }
  });
  res.send(data);
}
