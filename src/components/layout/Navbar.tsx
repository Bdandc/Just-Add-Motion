import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAppPage = location.pathname === '/create' || location.pathname === '/account';

  if (isAuthPage) return null;

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">FixMotion<span className="text-primary">.ai</span></span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/create">
                <Button variant={location.pathname === '/create' ? 'secondary' : 'ghost'} size="sm">
                  Create
                </Button>
              </Link>
              <Link to="/account">
                <Button variant={location.pathname === '/account' ? 'secondary' : 'ghost'} size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : isAppPage ? (
            <Link to="/login">
              <Button size="sm" className="gradient-bg glow-primary">Login</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gradient-bg glow-primary">Try it free</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
