/// <reference types="vite/client" />
import { GoogleGenAI, type Schema } from '@google/genai';
import type { ModelId } from './fal';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface SuggestedPrompt {
  label: string;
  description: string; // shown to user — plain English
  prompt: string;      // hidden — sent to video model
}

export interface AnalysisResult {
  category: ImageCategory;
  suggestions: SuggestedPrompt[];
}

// ─── Category motion rules ────────────────────────────────────────────────────
// Only ONE category's rules are sent per request (after classification).
// Rules are injected into the system instruction, not the user message.

const CATEGORY_RULES: Record<ImageCategory, string> = {
  ui: `This image is a UI design, app screen, dashboard, or wireframe.

MOTION RULES:
- This is a flat 2D design. Camera movement (dolly, pan, zoom, crane) is NOT allowed.
- Animate only the UI elements that are visibly present in the image.
- Valid motion types: elements fading in sequentially, numbers counting up to a displayed value, chart bars or graphs growing from zero, progress bars filling, cards or panels sliding in, text lines revealing, icons doing a scale-in.
- Each of the 3 suggestions must animate a DIFFERENT part of the UI.
- Prompts must read like a product demo or app onboarding — no cinematic language.
- Do not reference any element that is not clearly visible in the image.`,

  portrait: `This image is a portrait or photograph of a person.

MOTION RULES:
- Animate only what is visible: natural human motion (hair, clothing, a breath).
- Camera moves must be slow and controlled: a gentle push in, a slow drift to one side.
- Do not add or invent any objects, backgrounds, or elements not already in the image.
- No dramatic movement — keep it intimate and believable.`,

  landscape: `This image is an outdoor landscape, nature scene, or environment.

MOTION RULES:
- Use camera movement as the primary technique: slow dolly, upward crane, lateral pan, parallax drift.
- Secondary motion must only reference elements clearly visible in the image. Trees sway only if trees are present. Water ripples only if water is present. Do not invent these.
- Do not add fog, mist, particles, lens flares, or any element not in the image.`,

  architecture: `This image is an architectural exterior or interior scene.

MOTION RULES:
- Use slow, deliberate camera movements: gradual crane up, slow dolly through a space, subtle pan across a facade.
- Do not add people, vehicles, objects, light sources, or environmental elements not already present.
- No invented atmospheric effects.`,

  product: `This image is a product or object photograph.

MOTION RULES:
- Suggest subtle orbital movement, a slow zoom into a texture or detail, or a gentle hover.
- Motion must showcase what is already in the image — do not add props, surfaces, or supporting objects.
- Keep movement minimal and elegant.`,

  food: `This image is a food or drink photograph.

MOTION RULES:
- Use slow zoom into visible texture or detail, a gentle overhead drift, or a tilt reveal.
- Secondary motion must only reference what is visible — steam only if steam is present, liquid only if liquid is present.
- Do not invent condensation, steam, bubbles, or any element not clearly visible.`,

  abstract: `This image is abstract art, a texture, a pattern, or a graphic.

MOTION RULES:
- Use slow zoom, gentle drift, subtle rotation, or parallax between visible layers.
- Refer only to existing shapes, colours, and forms in the image.
- Do not add new shapes, particles, or graphic elements.`,

  general: `This image does not fit a specific category.

MOTION RULES:
- Use camera movement or animate elements that are clearly present in the scene.
- Choose motion appropriate to the mood and composition of this specific image.
- Do not add any objects, particles, or environmental elements not already visible.`,
};

// ─── Complexity hints — branched by category type ─────────────────────────────

type CategoryType = 'ui' | 'cinematic';

function getCategoryType(cat: ImageCategory): CategoryType {
  return cat === 'ui' ? 'ui' : 'cinematic';
}

const COMPLEXITY_HINTS: Record<CategoryType, Record<Complexity, string>> = {
  ui: {
    simple:   'COMPLEXITY: SIMPLE. Animate one UI element only. One action. 1 sentence.',
    moderate: 'COMPLEXITY: MODERATE. Animate 2–3 UI elements with light sequencing. 1–2 sentences.',
    complex:  'COMPLEXITY: COMPLEX. Animate multiple UI components with staggered timing. 2–3 sentences. Reference only elements visible in the image.',
  },
  cinematic: {
    simple:   'COMPLEXITY: SIMPLE. One camera motion only. 1 sentence.',
    moderate: 'COMPLEXITY: MODERATE. One camera motion plus one secondary motion from an element already present. 1–2 sentences.',
    complex:  'COMPLEXITY: COMPLEX. A primary camera motion, a secondary motion from an existing element, and a specific technique (rack focus, parallax). 2–3 sentences.',
  },
};

// ─── Model vocabulary hints ───────────────────────────────────────────────────
// These only adjust sentence count and vocabulary — not the content of the motion.

const MODEL_VOCAB: Record<ModelId, string> = {
  wan:   'Target: Wan 2.1. Style: plain and direct. Max 1–2 short sentences. Avoid jargon.',
  kling: 'Target: Kling O3. Style: cinematic language allowed. Max 2 sentences. Terms like "parallax drift", "rack focus", "handheld sway" work well.',
  veo3:  'Target: Veo 3.1. Style: precise and specific. Max 3 sentences. Include a named camera technique.',
};

// ─── JSON schemas for structured output ──────────────────────────────────────

const CLASSIFICATION_SCHEMA: Schema = {
  type: 'object' as const,
  properties: {
    category: {
      type: 'string' as const,
      enum: ['ui', 'portrait', 'landscape', 'architecture', 'product', 'food', 'abstract', 'general'],
    },
  },
  required: ['category'],
};

const SUGGESTIONS_SCHEMA: Schema = {
  type: 'object' as const,
  properties: {
    suggestions: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          label:       { type: 'string' as const },
          description: { type: 'string' as const },
          prompt:      { type: 'string' as const },
        },
        required: ['label', 'description', 'prompt'],
      },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: ['suggestions'],
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

// ─── Step 1a: Classify the image (fast, cheap, one word) ─────────────────────

async function classifyImage(base64: string, mimeType: string): Promise<ImageCategory> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Classify this image into exactly one category.' },
        ],
      },
    ],
    config: {
      systemInstruction: `You classify images into exactly one of these categories:
- "ui"           — UI design, app screen, dashboard, website, wireframe, prototype
- "portrait"     — person, face, headshot, group of people
- "landscape"    — outdoor scene, nature, sky, environment, cityscape
- "architecture" — building, interior, room, structural space
- "product"      — product or object isolated or on a plain surface
- "food"         — food, drink, meal, ingredients
- "abstract"     — abstract art, texture, pattern, graphic, illustration
- "general"      — anything that does not clearly fit the above

Respond with JSON only.`,
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: CLASSIFICATION_SCHEMA,
    },
  });

  try {
    const parsed = JSON.parse(response.text ?? '{}') as { category?: string };
    return (parsed.category ?? 'general') as ImageCategory;
  } catch {
    return 'general';
  }
}

// ─── Step 1b: Generate suggestions for the classified category ───────────────

async function generateSuggestions(
  base64: string,
  mimeType: string,
  category: ImageCategory
): Promise<SuggestedPrompt[]> {
  const rules = CATEGORY_RULES[category];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: 'Generate 3 motion style suggestions for this image. Respond with JSON only.' },
        ],
      },
    ],
    config: {
      systemInstruction: `You write motion prompts for an AI image-to-video generator.

${rules}

ABSOLUTE CONSTRAINT: Do not invent, add, or imply any object, element, particle, effect, creature, or environmental detail that is not clearly and visibly present in the image. If you cannot see it, do not write it.

For each suggestion:
- "label": 2–4 word plain-English title the viewer understands (e.g. "Numbers Count Up", "Slow Zoom In")
- "description": 1 plain-English sentence describing what the viewer will see. No jargon.
- "prompt": the technical motion instruction sent directly to the video model. Reference only what is visibly in the image. Be specific and concise.

The 3 suggestions must each describe a meaningfully different motion approach.`,
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: SUGGESTIONS_SCHEMA,
    },
  });

  try {
    const parsed = JSON.parse(response.text ?? '{}') as { suggestions?: Partial<SuggestedPrompt>[] };
    const list = parsed.suggestions ?? [];
    if (list.length === 0) throw new Error('Empty suggestions');
    return list.slice(0, 3).map((s, i) => ({
      label: s.label ?? `Motion ${i + 1}`,
      description: s.description ?? '',
      prompt: s.prompt ?? '',
    }));
  } catch {
    return FALLBACK_RESULT.suggestions;
  }
}

// ─── Public: Classify + suggest ──────────────────────────────────────────────

export async function analyzeImageForPrompts(imageFile: File): Promise<AnalysisResult> {
  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type || 'image/jpeg';

  // Two focused calls: classify first, then generate with only the matching rules
  const category = await classifyImage(base64, mimeType);
  console.log('[gemini] classified as:', category);

  const suggestions = await generateSuggestions(base64, mimeType, category);
  console.log('[gemini] suggestions:', suggestions);

  return { category, suggestions };
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
      prompt: 'Gentle lateral parallax drift from left to right.',
    },
    {
      label: 'Rising Camera',
      description: 'The camera slowly lifts upward to reveal the full scene.',
      prompt: 'Smooth upward crane movement revealing the full composition.',
    },
  ],
};

// ─── Step 2: Adapt prompt for model + complexity ──────────────────────────────
// No image here — only adapts vocabulary and sentence structure.
// Does NOT add new content.

export async function tailorPromptForModel(
  basePrompt: string,
  modelId: ModelId,
  complexity: Complexity = 'moderate',
  category: ImageCategory = 'general'
): Promise<string> {
  const catType = getCategoryType(category);
  const complexityHint = COMPLEXITY_HINTS[catType][complexity];
  const modelVocab = MODEL_VOCAB[modelId];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Adapt this motion prompt for a specific model and complexity level.

Base prompt:
"${basePrompt}"

${modelVocab}
${complexityHint}

RULES:
- Keep the same motion concept. Do not introduce any new motion ideas.
- Only adjust: sentence count, sentence length, and technical vocabulary.
- Do not add any objects, effects, elements, or actions not already present in the base prompt.

Output the adapted prompt only. No quotes, no labels, no explanation.`,
          },
        ],
      },
    ],
    config: { temperature: 0.2, maxOutputTokens: 300 },
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
        role: 'user',
        parts: [
          {
            text: `Adjust this motion prompt based on the user's instruction.

Current prompt: "${currentPrompt}"
User instruction: "${editInstruction}"

Apply the instruction. Do not add any objects or elements not already in the current prompt.

Output the adjusted prompt only. No quotes, no explanation.`,
          },
        ],
      },
    ],
    config: { temperature: 0.3, maxOutputTokens: 300 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}
