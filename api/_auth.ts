import { createClient } from '@supabase/supabase-js';

// Server-side verification of the caller's Supabase session, so the proxy
// endpoints (/api/fal/proxy, /api/gemini) are not open to the public. Reuses
// the project's Supabase URL + anon key — already in the Vercel env for the
// client build (VITE_-prefixed vars are still readable inside functions).
// Files prefixed with `_` in /api are shared helpers, not routes.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/** Strip "Bearer " from a header value (handles arrays + null). */
export function bearerToken(header: string | string[] | undefined | null): string {
  const raw = Array.isArray(header) ? header[0] ?? '' : header ?? '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

/** True only when the token is a valid, current Supabase session. */
export async function isAuthedRequest(token: string): Promise<boolean> {
  if (!token || !supabase) return false;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data?.user);
  } catch {
    return false;
  }
}
