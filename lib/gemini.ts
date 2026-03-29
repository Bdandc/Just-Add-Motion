/// <reference types="vite/client" />
import { GoogleGenAI } from '@google/genai';
import type { ModelId } from './fal';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export type ImageCategory =
  | 'ui'           // UI mockup, dashboard, app screen, wireframe, website
  | 'portrait'     // person, face, headshot
  | 'landscape'    // outdoor scene, nature, sky, environment
  | 'architecture' // building, interior, room, space
  | 'product'      // product, object, item on background
  | 'food'         // food, drink, meal
  | 'abstract'     // abstract art, texture, pattern, graphic
  | 'general';     // fallback

export type Complexity = 'simple' | 'moderate' | 'complex';

// ─── Category-specific motion rules ─────────────────────────────────────────

const CATEGORY_MOTION_RULES: Record<ImageCategory, string> = {
  ui: `IMAGE TYPE: UI design, app mockup, dashboard, screen, or wireframe.

MOTION RULES — UI ONLY:
- This is a FLAT 2D design. Do NOT use camera movement (no dolly, pan, zoom, crane).
- Animate the UI elements themselves, exactly as they would behave in a real app:
  * Data elements: numbers counting up to their final value, progress bars filling, charts/bars growing from zero
  * Layout elements: cards or panels fading in sequentially, staggered from top to bottom
  * Content: text lines revealing left-to-right, icons appearing with a subtle scale-in
  * Interactive: a button or element pulsing once to draw attention
- Each suggestion should animate a DIFFERENT part of the UI (e.g. one focuses on data, one on layout, one on a specific component)
- Keep it plausible — animations should look like a real product demo or onboarding screen`,

  portrait: `IMAGE TYPE: Portrait, person, or human subject.

MOTION RULES — PORTRAIT:
- Focus on natural, believable human motion: hair moving gently, clothing shifting, a subtle breath
- Camera moves should be slow and controlled: a gentle push in, a slow drift to one side
- Avoid dramatic movement — keep it intimate and realistic
- Do NOT add any objects, backgrounds, or elements not already in the image`,

  landscape: `IMAGE TYPE: Landscape, outdoor scene, or environment.

MOTION RULES — LANDSCAPE:
- Use camera movement as the primary technique: dolly, upward crane, slow pan, parallax drift
- Only animate elements already clearly visible in the scene — if there are trees, they can sway; if there is water, it can ripple; if there are clouds, they can drift
- Do NOT invent environmental elements not present in the image`,

  architecture: `IMAGE TYPE: Architecture, building, or interior scene.

MOTION RULES — ARCHITECTURE:
- Use slow, deliberate camera movements: a gradual reveal crane up, a slow dolly through a space, a subtle pan across a facade
- Lighting shifts should only enhance what is already there — not add new light sources
- Do NOT add people, objects, or environmental elements not present`,

  product: `IMAGE TYPE: Product or object photography.

MOTION RULES — PRODUCT:
- Suggest subtle rotational or orbital movement, a slow zoom into a detail, or a gentle hover effect
- Motion should showcase the product — reveal a texture, emphasise a shape
- Do NOT add props, backgrounds, or supporting objects not already in the image`,

  food: `IMAGE TYPE: Food or drink photography.

MOTION RULES — FOOD:
- Use slow zoom into texture or detail, a gentle overhead drift, or a subtle tilt reveal
- Only animate elements clearly present — if there is steam, it can rise; if there is liquid, it can settle
- Do NOT invent steam, condensation, or any element not visible`,

  abstract: `IMAGE TYPE: Abstract art, texture, pattern, or graphic.

MOTION RULES — ABSTRACT:
- Use slow zoom, gentle drift, subtle rotation, or a parallax shift between layers
- Let the existing shapes, colours, and forms drive the motion
- Do NOT add any new shapes or graphic elements`,

  general: `IMAGE TYPE: General image.

MOTION RULES:
- Use camera movement (dolly, pan, crane) or animate elements already present in the scene
- Choose motions appropriate to the mood and composition of the specific image
- Do NOT add any objects, particles, or environmental elements not already visible`,
};

// ─── Complexity modifiers (category-aware) ───────────────────────────────────

const COMPLEXITY_HINTS: Record<Complexity, string> = {
  simple:
    'Complexity: SIMPLE. One single motion only. 1 sentence.',
  moderate:
    'Complexity: MODERATE. A primary motion plus one secondary motion from an element already present. 1–2 sentences.',
  complex:
    'Complexity: COMPLEX. A primary motion, a secondary motion from an existing element, and a specific technique detail. 2–3 sentences. Still no invented elements.',
};

// ─── Per-model tailoring (no new elements allowed) ───────────────────────────

const MODEL_HINTS: Record<ModelId, string> = {
  wan: `Target model: Wan 2.1 (budget, fast).
Style: Direct and clear. 1–2 sentences max. Simple motion language. Do NOT add any objects, particles, fog, smoke, or effects not in the base prompt.`,

  kling: `Target model: Kling O3 Standard (balanced quality).
Style: Cinematic language. Up to 2 sentences. Primary motion + optional secondary from existing elements only. Terms like "parallax drift", "handheld sway", "rack focus" work well. Do NOT invent atmospheric or environmental elements.`,

  veo3: `Target model: Veo 3.1 by Google DeepMind (premium quality).
Style: Precise and specific. Up to 3 sentences. Primary motion, secondary motion from existing subjects, and a camera technique. Do NOT add particles, smoke, fog, haze, lens flares, or any elements not in the base prompt.`,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface SuggestedPrompt {
  label: string;
  description: string; // shown to user — plain English
  prompt: string;      // hidden — technical base prompt, gets tailored per model
}

export interface AnalysisResult {
  category: ImageCategory;
  suggestions: SuggestedPrompt[];
}

// ─── Step 1: Classify + suggest ──────────────────────────────────────────────

const ANALYSIS_SYSTEM = `You are an expert at analyzing images and writing motion prompts for AI image-to-video generation.

Your task has two parts:
1. Classify what type of image this is.
2. Generate 3 motion style suggestions appropriate for that image type.

Classification categories:
- "ui"           — UI mockup, app screen, dashboard, website, wireframe, prototype
- "portrait"     — person, face, headshot, group of people
- "landscape"    — outdoor scene, nature, sky, environment, cityscape
- "architecture" — building, interior, room, structural space
- "product"      — product, object, item isolated or on a surface
- "food"         — food, drink, meal, ingredients
- "abstract"     — abstract art, texture, pattern, graphic, illustration
- "general"      — anything that does not clearly fit the above

For each suggestion provide:
- "label": 2–4 word plain-English title (e.g. "Numbers Count Up", "Slow Zoom In")
- "description": 1 sentence describing what the viewer sees — no jargon
- "prompt": the technical motion prompt sent to the video model — NOT shown to the user

STRICT RULES for the technical prompt:
- Follow the motion rules for the detected category (see below)
- NEVER invent objects, particles, smoke, fog, bokeh, lens flares, animals, people, or any element not clearly present in the image
- Describe ONLY motion — do not change the content of the scene

Respond ONLY with valid JSON in exactly this shape. No markdown, no backticks, no explanation:
{
  "category": "<category>",
  "suggestions": [
    { "label": "...", "description": "...", "prompt": "..." },
    { "label": "...", "description": "...", "prompt": "..." },
    { "label": "...", "description": "...", "prompt": "..." }
  ]
}`;

export async function analyzeImageForPrompts(imageFile: File): Promise<AnalysisResult> {
  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type || 'image/jpeg';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { inlineData: { mimeType, data: base64 } },
      {
        text: `Classify this image and generate 3 motion suggestions.

After classifying, apply these motion rules for the detected category:

${Object.entries(CATEGORY_MOTION_RULES).map(([k, v]) => `--- ${k.toUpperCase()} ---\n${v}`).join('\n\n')}

Now analyze the image, determine the correct category, and generate 3 suggestions using the rules for that category.`,
      },
    ],
    config: {
      systemInstruction: ANALYSIS_SYSTEM,
      temperature: 0.8,
      maxOutputTokens: 1000,
    },
  });

  const text = response.text?.trim();
  console.log('[gemini] raw response:', text);
  if (!text) throw new Error('Gemini returned an empty response');

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    console.error('[gemini] No JSON object found:', text);
    return FALLBACK_RESULT;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      category?: string;
      suggestions?: Partial<SuggestedPrompt>[];
    };

    const category = (parsed.category ?? 'general') as ImageCategory;
    const suggestions = (parsed.suggestions ?? []).slice(0, 3).map((s, i) => ({
      label: s.label ?? `Motion ${i + 1}`,
      description: s.description ?? s.prompt?.slice(0, 80) ?? 'A motion through the scene.',
      prompt: s.prompt ?? s.description ?? '',
    }));

    if (suggestions.length === 0) throw new Error('Empty suggestions');

    console.log('[gemini] category:', category, '| suggestions:', suggestions);
    return { category, suggestions };
  } catch (e) {
    console.error('[gemini] JSON parse failed:', e);
    return FALLBACK_RESULT;
  }
}

const FALLBACK_RESULT: AnalysisResult = {
  category: 'general',
  suggestions: [
    {
      label: 'Slow Zoom In',
      description: 'The camera gently moves closer, drawing you into the scene.',
      prompt: 'Slow dolly push into the scene, soft rack focus from mid-ground to foreground.',
    },
    {
      label: 'Gentle Drift',
      description: 'A subtle sideways drift reveals depth across the composition.',
      prompt: 'Gentle lateral parallax drift from left to right, background slightly out of focus.',
    },
    {
      label: 'Rising Camera',
      description: 'The camera slowly lifts upward to reveal the full scene.',
      prompt: 'Smooth upward crane movement revealing the full composition with natural parallax.',
    },
  ],
};

// ─── Step 2: Tailor for model + complexity ────────────────────────────────────

export async function tailorPromptForModel(
  basePrompt: string,
  modelId: ModelId,
  complexity: Complexity = 'moderate',
  category: ImageCategory = 'general'
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are an expert at writing prompts for AI image-to-video generation models.

${MODEL_HINTS[modelId]}

${COMPLEXITY_HINTS[complexity]}

The source image was classified as: ${category.toUpperCase()}
${CATEGORY_MOTION_RULES[category]}

Base motion concept to adapt:
"${basePrompt}"

Rewrite this prompt respecting the model style, complexity level, and category motion rules above. Keep the same core motion idea.

CRITICAL: Do NOT add any objects, particles, smoke, fog, haze, bokeh orbs, lens flares, or any visual elements not already described in the base concept.

Output ONLY the optimized prompt. No quotes, no label, no explanation.`,
      },
    ],
    config: { temperature: 0.7, maxOutputTokens: 400 },
  });

  return response.text?.trim() ?? basePrompt;
}

// ─── Step 3 (optional): Refine after generation ──────────────────────────────

export async function refineMotionPrompt(
  currentPrompt: string,
  editInstruction: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are a motion prompt engineer for AI image-to-video models.

Current prompt: "${currentPrompt}"

User edit request: "${editInstruction}"

Rewrite the prompt incorporating the edit. Keep the same cinematic style. Do NOT add any new objects or elements not already mentioned.

Output ONLY the refined prompt — no quotes, no explanation.`,
      },
    ],
    config: { temperature: 0.8, maxOutputTokens: 300 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}
