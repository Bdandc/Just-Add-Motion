/// <reference types="vite/client" />
import { fal } from '@fal-ai/client';

fal.config({
  credentials: import.meta.env.VITE_FAL_KEY,
});

export type ModelId = 'stable-video' | 'kling' | 'veo3';

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
    id: 'stable-video',
    falId: 'fal-ai/stable-video',
    name: 'Stable Video',
    tier: 'budget',
    tierLabel: 'Budget',
    costPer4s: '~$0.03',
    costPer6s: '~$0.04',
    costPer8s: '~$0.05',
    description: 'Fast, short clips. Good for testing.',
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

export async function generateVideo(
  input: GenerateVideoInput,
  onProgress?: (status: string) => void
): Promise<GenerateVideoResult> {
  const model = MODELS.find((m) => m.id === input.modelId)!;

  onProgress?.('Uploading image...');
  const imageUrl = await fal.storage.upload(input.imageFile);

  onProgress?.('Generating motion...');
  const result = await fal.subscribe(model.falId, {
    input: {
      image_url: imageUrl,
      prompt: input.prompt,
      duration: input.duration,
      aspect_ratio: 'auto',
      resolution: '720p',
      generate_audio: false,
    },
    onQueueUpdate(update) {
      if (update.status === 'IN_PROGRESS' && update.logs?.length) {
        const last = update.logs[update.logs.length - 1]?.message;
        if (last) onProgress?.(last);
      }
    },
  });

  const videoUrl = (result.data as { video: { url: string } }).video.url;
  return { videoUrl };
}
