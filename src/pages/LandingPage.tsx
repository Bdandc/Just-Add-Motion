import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadCloud, Sparkles, Download, Play, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }} />

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Sparkles className="w-3 h-3" />
          AI-powered motion
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 max-w-4xl"
        >
          Bring your images <br /> <span className="gradient-text">to life.</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl"
        >
          Upload an image, describe the motion, get an MP4 in seconds. <br className="hidden md:block" />
          Powered by state-of-the-art video generation models.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <Link to="/signup">
            <Button size="lg" className="h-14 px-8 text-lg gradient-bg glow-primary rounded-xl">
              Try it free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">No design skills needed</p>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-secondary/30 border-y border-border/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: UploadCloud, title: "Upload your image", desc: "Start with any JPG, PNG or WEBP file." },
              { icon: Sparkles, title: "Describe the motion", desc: "Tell the AI how you want the scene to move." },
              { icon: Download, title: "Download your MP4", desc: "Get high-quality video in under 30 seconds." }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 group-hover:border-primary/50 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Outputs */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Example outputs</h2>
              <p className="text-muted-foreground">See what's possible with FixMotion.ai</p>
            </div>
            <Link to="/signup">
              <Button variant="outline">View all showcase</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { prompt: "slow upward drift with light bokeh", img: "https://picsum.photos/seed/motion1/800/600" },
              { prompt: "cinematic zoom with falling leaves", img: "https://picsum.photos/seed/motion2/800/600" },
              { prompt: "parallax drift left, warm sunset", img: "https://picsum.photos/seed/motion3/800/600" },
              { prompt: "particles floating up, dark aesthetic", img: "https://picsum.photos/seed/motion4/800/600" }
            ].map((ex, i) => (
              <div key={i} className="group">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border flex">
                  <div className="w-1/2 h-full bg-muted relative">
                    <img src={ex.img} alt="Original" className="w-full h-full object-cover opacity-50 grayscale" referrerPolicy="no-referrer" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/50 text-[10px] uppercase font-bold">Static</div>
                  </div>
                  <div className="w-1/2 h-full bg-secondary relative flex items-center justify-center">
                    <img src={ex.img} alt="Animated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-primary text-[10px] uppercase font-bold">Animated</div>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground italic">"{ex.prompt}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 bg-background border-border hover:border-primary/50 transition-all">
              <h3 className="text-xl font-bold mb-2">Pay as you go</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">£0.15</span>
                <span className="text-muted-foreground">/ generation</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> £0 signup fee</li>
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> No monthly commitment</li>
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> High-quality MP4 exports</li>
              </ul>
              <Link to="/signup">
                <Button className="w-full" variant="outline">Get started</Button>
              </Link>
            </Card>
            
            <Card className="p-8 bg-background border-primary glow-primary relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2 py-1 rounded bg-primary text-[10px] font-bold uppercase">Best Value</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">£29</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> 300 generations / mo</li>
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> Priority processing queue</li>
                <li className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 text-primary" /> Commercial usage rights</li>
              </ul>
              <Link to="/signup">
                <Button className="w-full gradient-bg">Get started</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
