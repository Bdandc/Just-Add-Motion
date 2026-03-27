import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  UploadCloud, 
  Sparkles, 
  X, 
  Play, 
  Download, 
  RefreshCw, 
  Image as ImageIcon,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function CreatePage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('3s');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onload = (e) => {
            setImage(e.target?.result as string);
            setIsUploading(false);
            toast.success("Image uploaded successfully");
          };
          reader.readAsDataURL(file);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleGenerate = () => {
    if (!image) return;
    setIsGenerating(true);
    setResultVideo(null);

    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      setResultVideo('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
      toast.success("Generation complete!");
    }, 3000); // Faster for demo, but prompt says ~30s
  };

  const quickPrompts = [
    "Slow zoom in",
    "Parallax drift left",
    "Particles floating up",
    "Cinematic pan right"
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Left Column: Upload */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">1. Upload Image</h2>
            {image && (
              <Button variant="ghost" size="sm" onClick={() => setImage(null)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4 mr-2" /> Remove
              </Button>
            )}
          </div>
          
          <div 
            className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center ${
              image ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 bg-secondary/30'
            }`}
          >
            {isUploading ? (
              <div className="w-full max-w-xs space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium">Uploading your image...</p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : image ? (
              <img src={image} alt="Upload" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div 
                className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Drop your image here</h3>
                <p className="text-sm text-muted-foreground mb-4">or click to browse your files</p>
                <p className="text-xs text-muted-foreground/60 uppercase tracking-widest">JPG, PNG, WEBP (Max 20MB)</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt" className="text-lg font-bold">2. Describe the motion</Label>
              <span className="text-xs text-muted-foreground">{prompt.length}/500</span>
            </div>
            <Textarea 
              id="prompt"
              placeholder="e.g. Slow cinematic zoom in, dust particles floating upward, warm golden light flickering across the scene"
              className="min-h-[160px] bg-secondary/50 border-border resize-none text-base p-4 focus:ring-primary"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Quick prompts</p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="px-3 py-1.5 rounded-full bg-secondary border border-border text-xs hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-bold">3. Video length</Label>
            <div className="flex gap-2">
              {['3s', '5s', '8s'].map((d) => (
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

          <Button 
            onClick={handleGenerate}
            disabled={!image || isGenerating}
            className="w-full h-16 text-lg font-bold gradient-bg glow-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Generating... (this takes ~30s)
              </>
            ) : (
              <>
                Generate motion <Sparkles className="ml-2 w-5 h-5 group-hover:animate-pulse" />
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="my-16 bg-border/40" />

      {/* Bottom Half: Preview Area */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Preview Area</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ImageIcon className="w-4 h-4" /> Original
            </div>
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-secondary/20 overflow-hidden flex items-center justify-center">
              {image ? (
                <img src={image} alt="Original" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground/50">Upload an image to see it here</p>
                </div>
              )}
            </div>
            {image && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Info className="w-3 h-3" /> image_01.jpg</div>
                <div>1920 × 1080</div>
                <div>2.4 MB</div>
              </div>
            )}
          </div>

          {/* Animated Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" /> Animated
            </div>
            <div className="aspect-video rounded-2xl border-2 border-dashed border-border bg-secondary/20 overflow-hidden flex items-center justify-center relative">
              {isGenerating ? (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-10">
                  <div className="w-full max-w-xs space-y-4">
                    <div className="flex justify-center">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-sm font-medium animate-pulse">Creating cinematic motion...</p>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="h-full w-1/2 bg-primary"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {resultVideo ? (
                <div className="w-full h-full group relative">
                  <video 
                    src={resultVideo} 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium">
                      <Play className="w-3 h-3 fill-current" /> 0:00 / 0:0{duration.charAt(0)}
                    </div>
                    <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-primary" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground/50">Your animated video will appear here</p>
                </div>
              )}
            </div>
            
            {resultVideo && (
              <div className="flex flex-wrap gap-3">
                <Button className="flex-1 gradient-bg glow-primary h-11">
                  <Download className="w-4 h-4 mr-2" /> Download MP4
                </Button>
                <Button variant="outline" className="flex-1 h-11" onClick={handleGenerate}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Generate again
                </Button>
                <Button variant="outline" className="h-11 px-4" onClick={() => {
                  setImage(null);
                  setResultVideo(null);
                }}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
