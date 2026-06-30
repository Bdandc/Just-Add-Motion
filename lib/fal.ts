/// <reference types="vite/client" />
import { fal, withMiddleware, withProxy, type RequestMiddleware } from '@fal-ai/client';
import { supabase } from './supabase';

// Attach the app's Supabase session so the fal proxy can verify the caller and
// reject unauthenticated requests. Sent as the `x-app-auth` header, which the
// proxy reads for auth and does NOT forward to fal.
const addAppAuth: RequestMiddleware = async (request) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    ...request,
    headers: { ...(request.headers ?? {}), 'x-app-auth': token ? `Bearer ${token}` : '' },
  };
};

// Credentials stay server-side; requests route through the Vercel proxy.
fal.config({
  requestMiddleware: withMiddleware(addAppAuth, withProxy({ targetUrl: '/api/fal/proxy' })),
});

export type ModelId = 'wan' | 'kling' | 'veo3';

export interface ModelOption {
  id: ModelId;
  falId: string;
  name: string;
  tier: 'budget' | 'balanced' | 'premium';
  tierLabel: string;
  costPer4s: string;
  costPer6s: string;
  costPer8s: string;
  description: string;
  color: string;
}

export const MODELS: ModelOption[] = [
  {
    id: 'wan',
    falId: 'fal-ai/wan/v2.2-5b/image-to-video',
    name: 'Wan 2.2',
    tier: 'budget',
    tierLabel: 'Budget',
    costPer4s: '~$0.04',
    costPer6s: '~$0.06',
    costPer8s: '~$0.08',
    description: 'Fast, good quality at low cost.',
    color: 'text-emerald-400',
  },
  {
    id: 'kling',
    falId: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
    name: 'Kling 2.5 Turbo',
    tier: 'balanced',
    tierLabel: 'Balanced',
    costPer4s: '~$0.25',
    costPer6s: '~$0.25',
    costPer8s: '~$0.49',
    description: 'Great quality at a reasonable price.',
    color: 'text-blue-400',
  },
  {
    id: 'veo3',
    falId: 'fal-ai/veo3.1/image-to-video',
    name: 'Veo 3.1',
    tier: 'premium',
    tierLabel: 'Premium',
    costPer4s: '~$0.80',
    costPer6s: '~$1.20',
    costPer8s: '~$1.60',
    description: 'Best quality. Cinematic 1080p results.',
    color: 'text-violet-400',
  },
];

export type AspectRatio = '16:9' | '9:16' | '1:1';

export interface GenerateVideoInput {
  imageFile: File;
  prompt: string;
  duration: '4s' | '6s' | '8s';
  modelId: ModelId;
  /** Auto-upscale the source image before generation for sharper motion. Default true. */
  upscaleInput?: boolean;
  /** Veo 3.1 native audio. Default false (still-to-motion). */
  generateAudio?: boolean;
  /** Topaz post-pass: 2x upscale + 60fps interpolation. Default false (adds cost + time). */
  polish?: boolean;
  /** Reuse a seed to reproduce/lock a result (honored by Veo + Wan). Random if omitted. */
  seed?: number;
}

export interface GenerateVideoResult {
  videoUrl: string;
  /** The seed used — store it to let the user lock or reroll. */
  seed: number;
  /** Aspect ratio detected from the source image. */
  aspectRatio: AspectRatio;
}

// Shared negative prompt to suppress the artifacts image-to-video models drift into.
const NEGATIVE_PROMPT =
  'blurry, low quality, distorted, warped face, morphing, flickering, jitter, extra limbs, deformed hands';

// Wan 2.2 has no `duration` param — length is num_frames / fps (max 161 frames).
function wanFrames(secs: number): { num_frames: number; frames_per_second: number } {
  const FPS = 24;
  const wanted = secs * FPS + 1; // models expect ~4n+1 frame counts
  if (wanted <= 161) return { num_frames: wanted, frames_per_second: FPS };
  // 8s exceeds the 161-frame cap at 24fps; drop fps so the duration is preserved, not truncated.
  return { num_frames: 161, frames_per_second: Math.max(4, Math.round(160 / secs)) };
}

// Veo's aspect enum has no 1:1 — fall back to auto for square sources.
function veoAspect(a: AspectRatio): '16:9' | '9:16' | 'auto' {
  return a === '1:1' ? 'auto' : a;
}

function buildInput(imageUrl: string, input: GenerateVideoInput, aspectRatio: AspectRatio, seed: number) {
  const secs = parseInt(input.duration); // "4s" → 4

  if (input.modelId === 'wan') {
    // Wan 2.2 5B: resolution 580p|720p, length via num_frames + fps, supports 1:1.
    return {
      image_url: imageUrl,
      prompt: input.prompt,
      resolution: '720p',
      aspect_ratio: aspectRatio,
      negative_prompt: NEGATIVE_PROMPT,
      seed,
      ...wanFrames(secs),
    };
  }

  if (input.modelId === 'kling') {
    // Kling 2.5 Turbo Pro: duration enum "5" | "10"; no aspect_ratio or seed params
    // (it derives orientation from the source image).
    return {
      image_url: imageUrl,
      prompt: input.prompt,
      duration: secs >= 8 ? '10' : '5',
      cfg_scale: 0.5,
      negative_prompt: NEGATIVE_PROMPT,
    };
  }

  // veo3 → Veo 3.1: 1080p (default is 720p), audio off by default, negative prompt, seed.
  return {
    image_url: imageUrl,
    prompt: input.prompt,
    duration: input.duration, // "4s" | "6s" | "8s"
    aspect_ratio: veoAspect(aspectRatio),
    resolution: '1080p',
    generate_audio: input.generateAudio ?? false,
    negative_prompt: NEGATIVE_PROMPT,
    seed,
  };
}

function extractVideoUrl(data: unknown): string {
  const d = data as Record<string, unknown>;
  const url =
    (d?.video as { url?: string } | undefined)?.url ??
    (d as { url?: string })?.url ??
    ((d?.frames as { url?: string }[] | undefined)?.[0])?.url;

  if (!url) {
    throw new Error(`No video URL found in response. Raw: ${JSON.stringify(data)}`);
  }
  return url;
}

async function getImageSize(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

// Map the source image's orientation to the closest supported aspect ratio.
function pickAspect(width: number, height: number): AspectRatio {
  const r = width / height;
  if (r >= 1.2) return '16:9';
  if (r <= 0.83) return '9:16';
  return '1:1';
}

export async function generateVideo(
  input: GenerateVideoInput,
  onProgress?: (status: string) => void
): Promise<GenerateVideoResult> {
  const model = MODELS.find((m) => m.id === input.modelId)!;

  // Detect orientation so portrait/social sources aren't forced to 16:9.
  let aspectRatio: AspectRatio = '16:9';
  let minDim = Infinity;
  try {
    const size = await getImageSize(input.imageFile);
    aspectRatio = pickAspect(size.width, size.height);
    minDim = Math.min(size.width, size.height);
  } catch (e) {
    console.warn('[fal] image size detection failed, defaulting to 16:9:', e);
  }

  onProgress?.('Uploading image...');
  let imageUrl = await fal.storage.upload(input.imageFile);

  // Pre-pass: image-to-video inherits the source frame's sharpness, so upscale
  // soft/small inputs first. Skip already-large images to save cost. Non-fatal.
  if ((input.upscaleInput ?? true) && minDim < 1536) {
    onProgress?.('Sharpening source...');
    try {
      const up = await fal.subscribe('fal-ai/clarity-upscaler', {
        input: { image_url: imageUrl, upscale_factor: 2, creativity: 0.2, resemblance: 0.85 },
      });
      const upUrl = (up.data as { image?: { url?: string } })?.image?.url;
      if (upUrl) imageUrl = upUrl;
    } catch (e) {
      console.warn('[fal] input upscale skipped (non-fatal):', e);
    }
  }

  // Client-controlled seed enables lock/reroll (honored by Veo + Wan).
  const seed = input.seed ?? Math.floor(Math.random() * 2_147_483_647);

  onProgress?.('Generating motion...');
  const falInput = buildInput(imageUrl, input, aspectRatio, seed);
  const result = await fal.subscribe(model.falId, {
    input: falInput,
    onQueueUpdate(update) {
      if (update.status === 'IN_PROGRESS' && update.logs?.length) {
        const last = update.logs[update.logs.length - 1]?.message;
        if (last) onProgress?.(last);
      }
    },
  });
  let videoUrl = extractVideoUrl(result.data);

  // Post-pass: optional Topaz 2x upscale + 60fps interpolation for a premium feel.
  if (input.polish) {
    onProgress?.('Polishing (upscale + 60fps)...');
    try {
      const pol = await fal.subscribe('fal-ai/topaz/upscale/video', {
        input: { video_url: videoUrl, upscale_factor: 2, target_fps: 60 },
      });
      const polUrl = (pol.data as { video?: { url?: string } })?.video?.url;
      if (polUrl) videoUrl = polUrl;
    } catch (e) {
      console.warn('[fal] polish skipped (non-fatal), keeping base video:', e);
    }
  }

  return { videoUrl, seed, aspectRatio };
}
