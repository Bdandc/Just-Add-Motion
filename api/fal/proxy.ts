import { createHandler } from '@fal-ai/server-proxy/express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side proxy for fal.ai requests. Keeps the fal credential out of the
// browser bundle entirely — the client (`lib/fal.ts`) is configured with
// `proxyUrl: '/api/fal/proxy'` and never sees the key.
//
// The handler reads the credential from `process.env.FAL_KEY`, so set FAL_KEY
// in the Vercel project's Environment Variables (Production + Preview).
//
// NOTE: the proxy currently allows unauthenticated requests (the package
// default). The key is safe from extraction, but anyone who can reach this
// endpoint can spend on the fal account. Gating it to authenticated Supabase
// users is a recommended follow-up (pass a custom `isAuthenticated` to
// `createHandler`).
const falProxy = createHandler();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // @fal-ai/server-proxy ships an Express-style (req, res, next) handler.
  // Vercel's Node request/response objects are compatible at runtime.
  return falProxy(req as any, res as any, () => undefined);
}
