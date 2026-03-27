import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[40%] bg-secondary border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px]" />
        
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FixMotion<span className="text-primary">.ai</span></span>
        </Link>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4">Welcome back.</h2>
          <p className="text-muted-foreground text-lg mb-8">Continue bringing your static images to life with cinematic AI motion.</p>
          
          <div className="rounded-xl border border-border bg-background/50 p-4 backdrop-blur-sm">
            <div className="flex gap-4 aspect-video rounded-lg overflow-hidden border border-border">
              <div className="w-1/2 bg-muted flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30" />
              </div>
              <div className="w-1/2 bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground relative z-10">
          © 2026 FixMotion.ai
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">FixMotion<span className="text-primary">.ai</span></span>
            </Link>
          </div>
          
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-muted-foreground">Enter your credentials to access your account</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" className="h-12 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <Input id="password" type="password" className="h-12 bg-secondary/50" />
            </div>
            <Link to="/create">
              <Button className="w-full h-12 gradient-bg glow-primary mt-2">Login</Button>
            </Link>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <Button variant="outline" className="w-full h-12 bg-secondary/30">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
