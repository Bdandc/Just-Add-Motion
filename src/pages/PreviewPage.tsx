import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Download,
  RefreshCw,
  ImageIcon,
  Loader2,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
  Maximize2,
  X,
  Dices,
  Lock,
  LockOpen,
} from 'lucide-react';
import GeneratingOverlay from '@/src/components/GeneratingOverlay';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { generateVideo, MODELS, type ModelId } from '@/lib/fal';
import { refineMotionPrompt } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface PreviewState {
  videoUrl: string;
  imageDataUrl: string;
  prompt: string;
  modelId: ModelId;
  duration: '4s' | '6s' | '8s';
  seed?: number;
  enhanceSource?: boolean;
  polish?: boolean;
  audio?: boolean;
}

function dataUrlToFile(dataUrl: string, filename = 'image.jpg'): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export default function PreviewPage() {
  const { state } = useLocation() as { state: PreviewState | null };
  const navigate = useNavigate();
  const { user } = useAuth();

  const [videoUrl, setVideoUrl] = useState(state?.videoUrl ?? '');
  const [prompt, setPrompt] = useState(state?.prompt ?? '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [lightbox, setLightbox] = useState(false);
  const [seed, setSeed] = useState<number | undefined>(state?.seed);
  const [lockSeed, setLockSeed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // No state = direct navigation, send back to create
  if (!state?.videoUrl) {
    navigate('/create', { replace: true });
    return null;
  }

  const model = MODELS.find(m => m.id === state.modelId);
  // Only Veo + Wan accept a seed; Kling ignores it, so seed lock is meaningless there.
  const seedSupported = state.modelId === 'veo3' || state.modelId === 'wan';

  const handleDownload = async () => {
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `just-add-motion-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Try right-clicking the video to save');
    }
  };

  const runGeneration = async (promptToUse: string, seedToUse: number | undefined) => {
    setIsGenerating(true);
    setGeneratingStatus('Starting...');
    try {
      const imageFile = dataUrlToFile(state.imageDataUrl);
      const result = await generateVideo(
        {
          imageFile,
          prompt: promptToUse,
          duration: state.duration,
          modelId: state.modelId,
          upscaleInput: state.enhanceSource ?? true,
          polish: state.polish ?? false,
          generateAudio: state.audio ?? false,
          seed: seedToUse,
        },
        (status) => setGeneratingStatus(status)
      );
      setVideoUrl(result.videoUrl);
      setSeed(result.seed);
      toast.success('New version ready!');
      if (user) {
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt: promptToUse,
          model_id: state.modelId,
          duration: state.duration,
          video_url: result.videoUrl,
          status: 'complete',
          // seed + aspect_ratio omitted until the generations migration lands
          // (project paused, free-tier slot cap). Seed still flows via nav state.
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Generation failed: ${msg}`);
    } finally {
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  const handleRefineAndRegenerate = async () => {
    if (!refineInstruction.trim()) return;
    setIsRefining(true);
    let refinedPrompt = prompt;
    try {
      refinedPrompt = await refineMotionPrompt(prompt, refineInstruction);
      setPrompt(refinedPrompt);
      setRefineInstruction('');
      toast.success('Prompt refined. Regenerating...');
    } catch {
      toast.error('Refinement failed. Regenerating with original prompt');
    } finally {
      setIsRefining(false);
    }
    // Lock keeps the motion (same seed); otherwise a fresh seed for variety.
    await runGeneration(refinedPrompt, lockSeed ? seed : undefined);
  };

  // Reroll: same prompt, fresh seed for a different take on the same idea.
  const handleReroll = () => runGeneration(prompt, undefined);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/create', { state: { imageDataUrl: state.imageDataUrl } })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to editor
        </button>
        <div className="flex items-center gap-2">
          {model && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-secondary/60 ${model.color}`}>
              {model.name}
            </span>
          )}
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-secondary/60 text-muted-foreground">
            {state.duration}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 max-w-5xl space-y-10">

        {/* Video hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden bg-black border border-border group"
        >
  
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full max-h-[70vh] object-contain"
          />

          <button
            onClick={() => setLightbox(true)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-3"
        >
          <Button onClick={handleDownload} className="gradient-bg glow-primary h-11 px-6">
            <Download className="w-4 h-4 mr-2" /> Download MP4
          </Button>
          <Button
            variant="outline"
            className="h-11 px-5"
            onClick={handleReroll}
            disabled={isGenerating || isRefining}
          >
            <Dices className="w-4 h-4 mr-2" /> Reroll
          </Button>
          {seedSupported && (
            <Button
              variant="outline"
              className={`h-11 px-5 ${lockSeed ? 'border-primary text-primary' : ''}`}
              onClick={() => setLockSeed((v) => !v)}
              title={lockSeed ? 'Seed locked: regenerations keep this motion' : 'Lock the seed to keep this motion across regenerations'}
            >
              {lockSeed ? <Lock className="w-4 h-4 mr-2" /> : <LockOpen className="w-4 h-4 mr-2" />}
              {lockSeed ? 'Seed locked' : 'Lock seed'}
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11 px-5"
            onClick={() => navigate('/create', { state: { imageDataUrl: state.imageDataUrl } })}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Change motion style
          </Button>
          <Button variant="outline" className="h-11 px-5" onClick={() => navigate('/create')}>
            <ImageIcon className="w-4 h-4 mr-2" /> New image
          </Button>
        </motion.div>

        {/* Divider + comparison + refine */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Original image */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Original image</p>
            <div className="rounded-xl overflow-hidden border border-border bg-secondary/20 aspect-video flex items-center justify-center">
              <img src={state.imageDataUrl} alt="Original" className="w-full h-full object-contain" />
            </div>
          </motion.div>

          {/* Refine panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1.5" />
              Refine &amp; regenerate
            </p>

            {/* Current prompt */}
            <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-1">
              <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">Current prompt</p>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{prompt}"</p>
            </div>

            {/* Edit instruction */}
            <div className="space-y-2">
              <textarea
                placeholder="What to change? e.g. make it slower, zoom out more, pan left instead, hold on the subject longer..."
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <Button
                className="w-full h-11 gradient-bg glow-primary"
                onClick={handleRefineAndRegenerate}
                disabled={isRefining || isGenerating || !refineInstruction.trim()}
              >
                {isRefining ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refining prompt...</>
                ) : isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {generatingStatus || 'Generating...'}</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Refine &amp; regenerate</>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Full-screen generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <GeneratingOverlay
            status={generatingStatus}
            imagePreview={state.imageDataUrl}
            modelId={state.modelId}
          />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.video
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={videoUrl}
              autoPlay
              loop
              controls
              className="max-w-5xl max-h-[90vh] w-full rounded-xl"
              onClick={(e) => { e.stopPropagation(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
