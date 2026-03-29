/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';
import type { ModelId } from './fal';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Plain-English analysis — generates 3 user-facing options with a hidden base prompt
const ANALYSIS_PROMPT = `You are analyzing an image to suggest motion styles for an AI image-to-video generator.

Your job is to suggest 3 distinct, creative ways the image could be animated. Each option should feel meaningfully different — e.g. one intimate/close, one wide/environmental, one abstract/atmospheric.

For each option provide:
- "label": 2–4 word plain English title a non-expert would understand (e.g. "Slow Zoom In", "Gentle Sway", "Rising Camera")
- "description": 1 plain-English sentence describing what the viewer will see — no technical jargon (e.g. "The camera slowly moves closer, bringing out the texture and detail of the subject.")
- "prompt": a detailed technical motion prompt for the AI model — cinematic language, 2–3 sentences, referencing actual elements in the image. This is what gets sent to the video model, not shown to the user.

Rules for the technical prompt:
- Reference actual visible elements — never invent objects
- Include a primary motion (camera or subject) + an atmospheric layer (light, particles, shadow, etc.)
- Be specific: "dolly in", "parallax drift", "handheld sway", "upward crane", "rack focus"
- Bias toward subtle, elegant motion over dramatic

Respond ONLY with a valid JSON array of exactly 3 objects. No markdown, no backticks, no explanation.

Example:
[
  {
    "label": "Slow Zoom In",
    "description": "The camera gently moves closer, drawing the viewer into the scene.",
    "prompt": "Slow dolly push into the scene, soft rack focus from mid-ground to foreground detail. Ambient dust particles drift through warm directional light, casting subtle shifting shadows across textured surfaces."
  }
]`;

export type Complexity = 'simple' | 'moderate' | 'complex';

const COMPLEXITY_HINTS: Record<Complexity, string> = {
  simple:
    'Animation complexity: SIMPLE. Use a single, clean primary motion only. No layering, no atmospheric details. Short and unambiguous — 1 sentence max.',
  moderate:
    'Animation complexity: MODERATE. Include a primary motion plus one light atmospheric or environmental detail. Balanced — not too sparse, not too dense.',
  complex:
    'Animation complexity: COMPLEX. Layer multiple elements: a strong primary motion, secondary environmental or subject motion, atmospheric effects (particles, light, haze), and a texture/lighting note. Rich and cinematic — make full use of the model\'s capabilities.',
};

// Per-model tailoring hints — what each model responds to best
const MODEL_HINTS: Record<ModelId, string> = {
  wan: `Target model: Wan 2.1 (budget, fast).
Best practices: Keep it direct and clear. 1–2 sentences max. Describe motion simply — no jargon. Focus on one strong primary motion. Atmospheric details should be minimal and literal (e.g. "light flickers", "smoke drifts").`,

  kling: `Target model: Kling O3 Standard (balanced quality).
Best practices: Use cinematic language. 2–3 sentences. Include a primary camera/subject motion + one atmospheric layer. Terms like "parallax drift", "handheld sway", "rack focus", "bokeh shift" work well. Medium complexity.`,

  veo3: `Target model: Veo 3.1 by Google DeepMind (premium, highest quality).
Best practices: This model handles complex, layered descriptions excellently. 3–4 sentences. Include: primary motion, secondary environmental motion, atmospheric/lighting detail, and a physical texture note. Rich, specific language produces the best results.`,
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface SuggestedPrompt {
  label: string;
  description: string; // shown to user — plain English
  prompt: string;      // hidden — technical base prompt, gets tailored per model
}

// Step 1: Analyze image → 3 plain-English options with hidden technical prompts
export async function analyzeImageForPrompts(imageFile: File): Promise<SuggestedPrompt[]> {
  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type || 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { mimeType, data: base64 } },
      { text: 'Analyze this image and generate 3 distinct motion style options. Reference the actual content, mood, and composition of this specific image.' },
    ],
    config: {
      systemInstruction: ANALYSIS_PROMPT,
      temperature: 0.9,
      maxOutputTokens: 900,
    },
  });

  const text = response.text?.trim();
  console.log('[gemini] raw response:', text);
  if (!text) throw new Error('Gemini returned an empty response');

  // Robustly extract the JSON array — find first [ to last ] regardless of surrounding text
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    console.error('[gemini] No JSON array found in response:', text);
    return FALLBACK_SUGGESTIONS;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<SuggestedPrompt>[];
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty array');

    // Normalise each item — ensure all fields exist
    const normalised: SuggestedPrompt[] = parsed.slice(0, 3).map((s, i) => ({
      label: s.label ?? `Motion ${i + 1}`,
      description: s.description ?? s.prompt?.slice(0, 80) ?? 'A cinematic motion through the scene.',
      prompt: s.prompt ?? s.description ?? '',
    }));

    console.log('[gemini] parsed suggestions:', normalised);
    return normalised;
  } catch (e) {
    console.error('[gemini] JSON parse failed:', e, '\nRaw slice:', text.slice(start, end + 1));
    return FALLBACK_SUGGESTIONS;
  }
}

const FALLBACK_SUGGESTIONS: SuggestedPrompt[] = [
  {
    label: 'Slow Zoom In',
    description: 'The camera gently moves closer, drawing you into the scene.',
    prompt: 'Slow dolly push into the scene, soft rack focus from mid-ground to foreground. Ambient light shifts warmly across surfaces.',
  },
  {
    label: 'Gentle Drift',
    description: 'A subtle sideways drift reveals depth across the composition.',
    prompt: 'Gentle lateral parallax drift from left to right, soft bokeh shifts in the background. Atmospheric haze catches directional light.',
  },
  {
    label: 'Rising Camera',
    description: 'The camera slowly lifts upward to reveal the full scene.',
    prompt: 'Smooth upward crane movement revealing the full composition. Elements animate with staggered parallax, rim light catches edges with cinematic glow.',
  },
];

// Step 2: Tailor the selected base prompt for the chosen model + complexity
export async function tailorPromptForModel(
  basePrompt: string,
  modelId: ModelId,
  complexity: Complexity = 'moderate'
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are an expert at writing prompts for AI image-to-video generation models.

${MODEL_HINTS[modelId]}

${COMPLEXITY_HINTS[complexity]}

Base motion concept to adapt:
"${basePrompt}"

Rewrite this prompt respecting BOTH the model requirements AND the complexity level above. Keep the same core motion idea.

Output ONLY the optimized prompt text. No quotes, no label, no explanation.`,
      },
    ],
    config: { temperature: 0.7, maxOutputTokens: 400 },
  });

  return response.text?.trim() ?? basePrompt;
}

// Step 3 (optional): Refine after generation — user describes what to change
export async function refineMotionPrompt(
  currentPrompt: string,
  editInstruction: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are a cinematic motion prompt engineer. A user generated a video with this prompt:

"${currentPrompt}"

They want to adjust it: "${editInstruction}"

Rewrite the prompt incorporating their edit. Keep the same cinematic style and specificity. Output ONLY the refined prompt — no quotes, no explanation, no label.`,
      },
    ],
    config: { temperature: 0.8, maxOutputTokens: 300 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}
