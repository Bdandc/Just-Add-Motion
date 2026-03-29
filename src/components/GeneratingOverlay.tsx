import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clapperboard } from 'lucide-react';
import { MODELS, type ModelId } from '@/lib/fal';

const HINTS = [
  'Sit tight — this usually takes 30–90 seconds.',
  'AI is rendering every frame from your image.',
  'Compositing motion paths…',
  'Almost there — final frames rendering.',
  'Adding the finishing touches.',
];

interface Props {
  status: string;
  imagePreview: string | null;
  modelId: ModelId;
}

export default function GeneratingOverlay({ status, imagePreview, modelId }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHintIndex((i) => (i + 1) % HINTS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const model = MODELS.find((m) => m.id === modelId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-3xl animate-blob" />
      </div>

      <div className="relative flex flex-col items-center gap-8 max-w-sm w-full text-center">
        {imagePreview && (
          <div className="relative">
            <div className="w-36 h-36 rounded-2xl overflow-hidden border border-violet-500/30 shadow-lg shadow-violet-900/30">
              <img src={imagePreview} alt="Your image" className="w-full h-full object-cover" />
            </div>
            <motion.div
              className="absolute -inset-3 rounded-[28px] border border-violet-500/40"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute -inset-6 rounded-[36px] border border-violet-500/20"
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/90 text-white text-[11px] font-semibold shadow-lg whitespace-nowrap">
              <Clapperboard className="w-3 h-3" />
              {model?.name ?? 'AI'} is rendering
            </div>
          </div>
        )}

        <div className="space-y-3 w-full">
          <p className="text-base font-semibold text-foreground min-h-[24px]">
            {status || 'Generating motion…'}
          </p>
          <div className="relative h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '45%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">{timeLabel} elapsed</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={hintIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-sm text-muted-foreground/70 max-w-xs"
          >
            {HINTS[hintIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
