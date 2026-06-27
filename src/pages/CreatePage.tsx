import { useState, useRef, useEffect, ChangeEvent, DragEvent, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  UploadCloud,
  Sparkles,
  X,
  Loader2,
  Info,
  Wand2,
  Pen,
  Check,
  Maximize2,
} from 'lucide-react';
import GeneratingOverlay from '@/src/components/GeneratingOverlay';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { generateVideo, MODELS, type ModelId } from '@/lib/fal';
import { analyzeImageForPrompts, dataUrlToBase64, tailorPromptForModel, type SuggestedPrompt, type Complexity, type ImageCategory } from '@/lib/gemini';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';


const CATEGORY_LABELS: Record<string, string> = {
  ui:           'UI / Screen',
  portrait:     'Portrait',
  landscape:    'Landscape',
  architecture: 'Architecture',
  product:      'Product',
  food:         'Food & Drink',
  abstract:     'Abstract',
  general:      'General',
};

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
];

function dataUrlToFile(dataUrl: string, filename = 'image.jpg'): File {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

function QualityToggle({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
        active ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border bg-secondary/40 hover:border-primary/30'
      }`}
    >
      <div className={`mt-0.5 w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${active ? 'bg-primary' : 'bg-muted'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-[18px]' : 'left-0.5'}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-foreground' : 'text-foreground/80'}`}>{title}</p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

export default function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state: locationState } = useLocation() as { state: { imageDataUrl?: string } | null };

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<'4s' | '6s' | '8s'>('4s');
  const [modelId, setModelId] = useState<ModelId>('kling');
  const [complexity, setComplexity] = useState<Complexity>('moderate');
  const [enhanceSource, setEnhanceSource] = useState(true);
  const [polish, setPolish] = useState(false);
  const [audio, setAudio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tailoring state
  const [isTailoring, setIsTailoring] = useState(false);

  // AI suggestion state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([]);
  const [imageCategory, setImageCategory] = useState<ImageCategory | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [lightbox, setLightbox] = useState<{ src: string; type: 'image' | 'video' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load image when returning from preview page ("Change motion style")
  useEffect(() => {
    if (locationState?.imageDataUrl) {
      const file = dataUrlToFile(locationState.imageDataUrl);
      processImage(file);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processImage = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`Unsupported format: ${file.type || 'unknown'}. Use JPEG, PNG, WebP, GIF, or AVIF.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    // Reset state
    setIsUploading(true);
    setUploadProgress(0);
    setImageFile(file);
    setSuggestedPrompts([]);
    setImageCategory(null);
    setSelectedSuggestion(null);
    setShowCustom(false);
    setPrompt('');

    const mimeType = file.type || 'image/jpeg';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setIsUploading(false);
      setUploadProgress(100);

      // Reuse the base64 already decoded by the FileReader (no second read)
      const base64 = dataUrlToBase64(dataUrl);
      setIsAnalyzing(true);
      try {
        const result = await analyzeImageForPrompts(base64, mimeType);
        setImageCategory(result.category);
        setSuggestedPrompts(result.suggestions);
        toast.success('AI analyzed your image ✨');
      } catch (err) {
        console.error('[analyzeImage error]', err);
        toast.error('AI analysis failed. You can write your own prompt below');
        setShowCustom(true);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImage(file);
  };

  const tailorAndSet = useCallback(async (basePrompt: string, model: ModelId, cmplx: Complexity, cat: ImageCategory | null) => {
    setIsTailoring(true);
    try {
      const tailored = await tailorPromptForModel(basePrompt, model, cmplx, cat ?? 'general');
      setPrompt(tailored);
    } catch {
      setPrompt(basePrompt);
    } finally {
      setIsTailoring(false);
    }
  }, []);

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    setShowCustom(false);
    tailorAndSet(suggestedPrompts[index].prompt, modelId, complexity, imageCategory);
  };

  // Re-tailor when model or complexity changes and a suggestion is already selected
  useEffect(() => {
    if (selectedSuggestion === null || suggestedPrompts.length === 0) return;
    tailorAndSet(suggestedPrompts[selectedSuggestion].prompt, modelId, complexity, imageCategory);
  }, [modelId, complexity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCustomPrompt = () => {
    setSelectedSuggestion(null);
    setShowCustom(true);
    setPrompt('');
  };

  const handleGenerate = async () => {
    if (!imageFile || !prompt.trim()) {
      toast.error(!imageFile ? "Please upload an image first" : "Please select or write a motion prompt");
      return;
    }
    setIsGenerating(true);
    setGeneratingStatus('Starting...');

    try {
      const result = await generateVideo(
        { imageFile, prompt, duration, modelId, upscaleInput: enhanceSource, polish, generateAudio: audio },
        (status) => setGeneratingStatus(status)
      );
      if (user) {
        await supabase.from('generations').insert({
          user_id: user.id,
          prompt,
          model_id: modelId,
          duration,
          video_url: result.videoUrl,
          status: 'complete',
          // seed + aspect_ratio omitted until the generations migration lands
          // (project paused, free-tier slot cap). Seed still flows via nav state.
        });
      }
      navigate('/preview', {
        state: {
          videoUrl: result.videoUrl,
          imageDataUrl: imagePreview,
          prompt,
          modelId,
          duration,
          seed: result.seed,
          enhanceSource,
          polish,
          audio,
        },
      });
    } catch (err) {
      console.error('[generateVideo error]', err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Generation failed: ${message}`);
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setSuggestedPrompts([]);
    setImageCategory(null);
    setSelectedSuggestion(null);
    setShowCustom(false);
    setPrompt('');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left Column: Upload */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">1. Upload Image</h2>
            {imagePreview && (
              <Button variant="ghost" size="sm" onClick={handleClearImage} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4 mr-2" /> Remove
              </Button>
            )}
          </div>

          <div
            className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center ${
              isDragOver
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : imagePreview
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/30 bg-secondary/30'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="w-full max-w-xs space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium">Reading image...</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : imagePreview ? (
              <div className="relative w-full h-full group/img">
                <img
                  src={imagePreview}
                  alt="Upload"
                  className={`w-full h-full object-contain rounded-lg transition-all duration-300 ${isAnalyzing ? 'brightness-75' : ''}`}
                />

                {/* Scan animation overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                    {/* Corner brackets */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-violet-400 rounded-tl" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-violet-400 rounded-tr" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-violet-400 rounded-bl" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-violet-400 rounded-br" />
                    {/* Scan line */}
                    <div className="scan-line absolute left-0 right-0 h-px">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
                      <div className="w-full h-8 bg-gradient-to-b from-violet-400/20 to-transparent -mt-px" />
                    </div>
                    {/* Label */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-violet-500/40">
                      <Wand2 className="w-3 h-3 text-violet-400 animate-pulse" />
                      <span className="text-[11px] font-medium text-violet-300 tracking-wide">Analyzing...</span>
                    </div>
                  </div>
                )}

                {!isAnalyzing && (
                  <button
                    onClick={() => setLightbox({ src: imagePreview, type: 'image' })}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-sm"
                    title="Expand"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragOver ? 'bg-primary/20' : 'bg-muted'}`}>
                  <UploadCloud className={`w-8 h-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {isDragOver ? 'Drop it here!' : 'Drop your image here'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">or click to browse your files</p>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">JPG · PNG · WebP · GIF · AVIF · HEIC (Max 20MB)</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif"
            />
          </div>

          {imageFile && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Info className="w-3 h-3" /> {imageFile.name}</div>
              <div>{(imageFile.size / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          )}
        </div>

        {/* Right Column: Prompt + Settings */}
        <div className="space-y-8">
          {/* Section 2: Motion Prompt */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">2. Choose the motion</h2>

            {/* AI Analyzing State */}
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                      <Wand2 className="w-7 h-7 text-violet-400 animate-pulse" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-violet-500/40"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Reading your image...</p>
                  <p className="text-xs text-muted-foreground/60">Thinking up motion ideas just for this</p>
                </motion.div>
              )}

              {/* AI Suggestions */}
              {!isAnalyzing && suggestedPrompts.length > 0 && (
                <motion.div
                  key="suggestions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-violet-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Pick a motion style
                    </div>
                    {imageCategory && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground capitalize">
                        {CATEGORY_LABELS[imageCategory]}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {suggestedPrompts.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(i)}
                        className={`group text-left p-4 rounded-xl border transition-all ${
                          selectedSuggestion === i
                            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                            : 'border-border bg-secondary/40 hover:border-primary/30 hover:bg-secondary/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-semibold ${
                              selectedSuggestion === i ? 'text-foreground' : 'text-foreground/80'
                            }`}>
                              {s.label}
                            </span>
                            <p className={`text-sm mt-0.5 leading-relaxed ${
                              selectedSuggestion === i ? 'text-muted-foreground' : 'text-muted-foreground/70'
                            }`}>
                              {s.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 mt-0.5">
                            {selectedSuggestion === i ? (
                              isTailoring ? (
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-white" />
                                </div>
                              )
                            ) : null}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Complexity selector */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Animation complexity</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(imageCategory === 'ui' ? [
                        { id: 'simple',   label: 'Simple',   desc: '1 element animates' },
                        { id: 'moderate', label: 'Moderate', desc: '2–3 elements' },
                        { id: 'complex',  label: 'Complex',  desc: 'Staggered sequence' },
                      ] : [
                        { id: 'simple',   label: 'Simple',   desc: 'One clean motion' },
                        { id: 'moderate', label: 'Moderate', desc: 'Motion + detail' },
                        { id: 'complex',  label: 'Complex',  desc: 'Layered & cinematic' },
                      ] as const).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setComplexity(c.id)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            complexity === c.id
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-border bg-secondary/40 hover:border-primary/30'
                          }`}
                        >
                          <span className={`text-sm font-semibold ${complexity === c.id ? 'text-foreground' : 'text-foreground/80'}`}>
                            {c.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tailoring status */}
                  {isTailoring && selectedSuggestion !== null && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 text-xs text-violet-400"
                    >
                      <Wand2 className="w-3 h-3 animate-pulse" />
                      Optimising for {MODELS.find(m => m.id === modelId)?.name} · {complexity}...
                    </motion.p>
                  )}

                  {/* Write your own option */}
                  <button
                    onClick={handleCustomPrompt}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                      showCustom
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-dashed border-border hover:border-primary/30'
                    }`}
                  >
                    <Pen className={`w-4 h-4 ${showCustom ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${showCustom ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Write your own prompt
                    </span>
                  </button>

                  {showCustom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Textarea
                        placeholder="Describe the motion you want. e.g. slow cinematic zoom in, dust particles floating upward..."
                        className="min-h-[120px] bg-secondary/50 border-border resize-none text-base p-4 focus:ring-primary"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">{prompt.length}/500</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Empty state: no image uploaded yet */}
              {!isAnalyzing && suggestedPrompts.length === 0 && !imageFile && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wand2 className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground/60">Upload an image first</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">AI will suggest motion styles for your image</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Section 3: Model */}
          <div className="space-y-4">
            <Label className="text-lg font-bold">3. Model</Label>
            <div className="grid grid-cols-3 gap-2">
              {MODELS.map((m) => {
                const costByDuration = { '4s': m.costPer4s, '6s': m.costPer6s, '8s': m.costPer8s };
                const isSelected = modelId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setModelId(m.id)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-secondary hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{m.tierLabel}</span>
                      {m.tier === 'budget' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Cheapest</span>}
                      {m.tier === 'premium' && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-medium">Best</span>}
                    </div>
                    <span className="text-sm font-semibold">{m.name}</span>
                    <span className={`text-lg font-bold ${m.color}`}>{costByDuration[duration]}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">{m.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Duration */}
          <div className="space-y-4">
            <Label className="text-lg font-bold">4. Video length</Label>
            <div className="flex gap-2">
              {(['4s', '6s', '8s'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    duration === d
                      ? 'bg-primary border-primary text-white glow-primary'
                      : 'bg-secondary border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Quality */}
          <div className="space-y-3">
            <Label className="text-lg font-bold">5. Quality</Label>
            <div className="space-y-2">
              <QualityToggle
                active={enhanceSource}
                onClick={() => setEnhanceSource((v) => !v)}
                title="Enhance source"
                desc="Upscale and sharpen your image before animating. Biggest quality boost (~$0.04)."
              />
              <QualityToggle
                active={polish}
                onClick={() => setPolish((v) => !v)}
                title="Polish output"
                desc="Upscale the video 2x and smooth to 60fps. Adds cost and render time."
              />
              {modelId === 'veo3' && (
                <QualityToggle
                  active={audio}
                  onClick={() => setAudio((v) => !v)}
                  title="Generate audio"
                  desc="Veo 3.1 native soundtrack. Doubles the Veo cost."
                />
              )}
            </div>
          </div>

          {/* Prompt preview: shows the tailored prompt that will be sent to the model */}
          <AnimatePresence>
            {prompt && !isTailoring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">Prompt that will be sent to the model</p>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{prompt}"</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleGenerate}
            disabled={!imageFile || !prompt.trim() || isGenerating}
            className="w-full h-16 text-lg font-bold gradient-bg glow-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {generatingStatus || 'Generating...'}
              </>
            ) : (
              <>
                Generate motion <Sparkles className="ml-2 w-5 h-5 group-hover:animate-pulse" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Full-screen generation overlay */}
      <AnimatePresence>
        {isGenerating && (
          <GeneratingOverlay
            status={generatingStatus}
            imagePreview={imagePreview}
            modelId={modelId}
          />
        )}
      </AnimatePresence>

      {/* Lightbox (image-only, for uploaded image expand) */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-5xl max-h-[90vh] w-full"
              onClick={(e) => { e.stopPropagation(); }}
            >
              {lightbox.type === 'image' ? (
                <img src={lightbox.src} alt="Enlarged" className="w-full h-full object-contain max-h-[90vh] rounded-xl" />
              ) : (
                <video src={lightbox.src} autoPlay loop controls className="w-full max-h-[90vh] rounded-xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
