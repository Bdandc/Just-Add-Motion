import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bearerToken, isAuthedRequest } from './_auth';

// Server-side proxy for Gemini generateContent calls. Keeps the Gemini API key
// out of the browser bundle, gates on the caller's Supabase session, and only
// allows the model this app uses. Reads the key from JAM_GEMINI_API_KEY (set it
// in the Vercel project's Environment Variables).
const ALLOWED_MODELS = new Set(['gemini-2.5-flash']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await isAuthedRequest(bearerToken(req.headers.authorization)))) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const apiKey = process.env.JAM_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'JAM_GEMINI_API_KEY is not configured' });
    return;
  }

  const body = req.body;
  const model = body && typeof body === 'object' ? body.model : undefined;
  if (!model || !ALLOWED_MODELS.has(model)) {
    res.status(400).json({ error: 'Unsupported or missing model' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent(body);
    // The client only reads `.text`; return just that.
    res.status(200).json({ text: response.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed';
    res.status(500).json({ error: message });
  }
}
