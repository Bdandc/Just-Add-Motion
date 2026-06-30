import { createHandler } from '@fal-ai/server-proxy/express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bearerToken, isAuthedRequest } from '../_auth';

// Server-side proxy for fal.ai requests. Keeps FAL_KEY off the client, gates on
// the caller's Supabase session, and restricts to the fal endpoints this app
// uses. Reads the key from FAL_KEY (set it in the Vercel project env).
const ALLOWED_ENDPOINTS = [
  'fal-ai/veo3.1/**',
  'fal-ai/kling-video/**',
  'fal-ai/wan/**',
  'fal-ai/clarity-upscaler/**',
  'fal-ai/topaz/**',
];

const falProxy = createHandler({
  allowUnauthorizedRequests: false,
  allowedEndpoints: ALLOWED_ENDPOINTS,
  // Gate on the app's Supabase session (lib/fal.ts sends it as x-app-auth).
  isAuthenticated: async (behavior) => isAuthedRequest(bearerToken(behavior.getHeader('x-app-auth'))),
  // Always sign with the server-side key; never trust a client-supplied key.
  resolveFalAuth: async () => {
    const key = process.env.FAL_KEY;
    return key ? `Key ${key}` : undefined;
  },
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  // @fal-ai/server-proxy ships an Express-style (req, res, next) handler.
  // Vercel's Node request/response objects are compatible at runtime.
  return falProxy(req as any, res as any, () => undefined);
}
