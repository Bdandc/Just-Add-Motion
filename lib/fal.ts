/// <reference types="vite/client" />
import { fal } from '@fal-ai/client';

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
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
    falId: 'fal-ai/wan/v2.1/image-to-video',
    name: 'Wan 2.1',
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
    falId: 'fal-ai/kling-video/v1.6/standard/image-to-video',
    name: 'Kling 1.6',
    tier: 'balanced',
    tierLabel: 'Balanced',
    costPer4s: '~$0.11',
    costPer6s: '~$0.17',
    costPer8s: '~$0.22',
    description: 'Great quality at a reasonable price.',
    color: 'text-blue-400',
  },
  {
    id: 'veo3',
    falId: 'fal-ai/veo3/fast/image-to-video',
    name: 'Veo 3 Fast',
    tier: 'premium',
    tierLabel: 'Premium',
    costPer4s: '~$0.40',
    costPer6s: '~$0.60',
    costPer8s: '~$0.80',
    description: 'Best quality. Cinematic results.',
    color: 'text-violet-400',
  },
];

export interface GenerateVideoInput {
  imageFile: File;
  prompt: string;
  duration: '4s' | '6s' | '8s';
  modelId: ModelId;
}

export interface GenerateVideoResult {
  videoUrl: string;
}

// Kling only accepts "5" or "10" — map our UI values to the nearest valid option
function klingDuration(duration: string): '5' | '10' {
  const secs = parseInt(duration);
  return secs <= 6 ? '5' : '10';
}

function buildInput(imageUrl: string, input: GenerateVideoInput) {
  const secs = parseInt(input.duration); // "4s" → 4

  if (input.modelId === 'wan') {
    return {
      image_url: imageUrl,
      prompt: input.prompt,
      num_seconds: secs,
      resolution: '720p',
    };
  }

  if (input.modelId === 'kling') {
    return {
      image_url: imageUrl,
      prompt: input.prompt,
      duration: klingDuration(input.duration),
      aspect_ratio: '16:9',
    };
  }

  // veo3
  return {
    image_url: imageUrl,
    prompt: input.prompt,
    duration: String(secs),
    aspect_ratio: '16:9',
    resolution: '720p',
    generate_audio: false,
  };
}

function extractVideoUrl(data: unknown): string {
  console.log('[fal] raw response data:', JSON.stringify(data, null, 2));
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

export async function generateVideo(
  input: GenerateVideoInput,
  onProgress?: (status: string) => void
): Promise<GenerateVideoResult> {
  const model = MODELS.find((m) => m.id === input.modelId)!;
  const falInput = buildInput('__placeholder__', input); // log what we'll send
  console.log('[fal] model:', model.falId);
  console.log('[fal] input shape:', JSON.stringify({ ...falInput, image_url: '<uploading>' }));

  onProgress?.('Uploading image...');
  const imageUrl = await fal.storage.upload(input.imageFile);
  console.log('[fal] uploaded image URL:', imageUrl);

  onProgress?.('Generating motion...');
  const result = await fal.subscribe(model.falId, {
    input: buildInput(imageUrl, input),
    onQueueUpdate(update) {
      console.log('[fal] queue update:', update.status);
      if (update.status === 'IN_PROGRESS' && update.logs?.length) {
        const last = update.logs[update.logs.length - 1]?.message;
        if (last) onProgress?.(last);
      }
    },
  });

  console.log('[fal] full result:', result);
  const videoUrl = extractVideoUrl(result.data);
  return { videoUrl };
}
