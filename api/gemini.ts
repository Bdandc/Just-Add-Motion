import { GoogleGenAI } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side proxy for Gemini generateContent calls. Keeps the Gemini API key
// out of the browser bundle — the client (`lib/gemini.ts`) POSTs the request
// here and only ever receives back `{ text }`.
//
// Reads the key from `process.env.JAM_GEMINI_API_KEY`, so set JAM_GEMINI_API_KEY
// in the Vercel project's Environment Variables (Production + Preview).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.JAM_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'JAM_GEMINI_API_KEY is not configured' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent(req.body);
    // The client only reads `.text`; return just that.
    res.status(200).json({ text: response.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed';
    res.status(500).json({ error: message });
  }
}
