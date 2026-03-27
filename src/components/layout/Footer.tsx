import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">FixMotion<span className="text-primary">.ai</span></span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm">
              The world's most intuitive AI motion platform. Bring your static images to life in seconds.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/create" className="hover:text-primary transition-colors">Create</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Examples</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Privacy</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Terms</Link></li>
              <li><Link to="/" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 FixMotion.ai. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
