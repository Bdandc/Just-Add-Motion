import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  User,
  CreditCard,
  BarChart3,
  Download,
  Settings,
  ShieldCheck,
  History,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, type Generation } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { MODELS } from '@/lib/fal';

const MONTHLY_LIMIT = 300;

export default function AccountPage() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setGenerations(data as Generation[]);
        setLoadingHistory(false);
      });
  }, [user]);

  const handleDownload = async (videoUrl: string) => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fixmotion-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed — try opening the link directly');
    }
  };

  const usagePercent = Math.round((generations.length / MONTHLY_LIMIT) * 100);
  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const getModelName = (modelId: string) =>
    MODELS.find((m) => m.id === modelId)?.name ?? modelId;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground">Manage your profile and view usage</p>
      </div>

      <Tabs defaultValue="usage" className="space-y-8">
        <TabsList className="bg-secondary/50 p-1 border border-border/50">
          <TabsTrigger value="usage" className="data-[state=active]:bg-background">
            <BarChart3 className="w-4 h-4 mr-2" /> Usage
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-background">
            <CreditCard className="w-4 h-4 mr-2" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-secondary/20 border-border md:col-span-2">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Current Period</p>
                  <h3 className="text-xl font-bold">{monthLabel}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{generations.length}</span>
                  <span className="text-muted-foreground"> / {MONTHLY_LIMIT}</span>
                </div>
              </div>
              <Progress value={usagePercent} className="h-2 mb-3" />
              <p className="text-xs text-muted-foreground">
                {generations.length === 0
                  ? 'No generations yet this month.'
                  : `${usagePercent}% of your monthly limit used.`}
              </p>
            </Card>

            <Card className="p-6 bg-primary/10 border-primary/20 flex flex-col justify-center">
              <p className="text-sm font-medium mb-1">Need more?</p>
              <p className="text-xs text-muted-foreground mb-4">Upgrade for unlimited generations.</p>
              <Button size="sm" className="w-full gradient-bg">View Plans</Button>
            </Card>
          </div>

          <Card className="bg-secondary/20 border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Recent Generations
              </h3>
              <span className="text-xs text-muted-foreground">{generations.length} this month</span>
            </div>

            {loadingHistory ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : generations.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No generations yet this month.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Head to Create to make your first one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generations.map((gen) => (
                    <TableRow key={gen.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(gen.created_at)}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{gen.prompt}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getModelName(gen.model_id)}</TableCell>
                      <TableCell className="text-sm">{gen.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant={gen.status === 'complete' ? 'default' : 'destructive'}
                          className="text-[10px] px-2 py-0 capitalize"
                        >
                          {gen.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {gen.video_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(gen.video_url!)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-secondary/20 border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Personal Information
            </h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="bg-muted/50 border-border cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-secondary/20 border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Security
            </h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="6+ characters" className="bg-background border-border" />
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  const input = document.getElementById('new-password') as HTMLInputElement;
                  if (!input.value || input.value.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    return;
                  }
                  const { error } = await supabase.auth.updateUser({ password: input.value });
                  if (error) toast.error(error.message);
                  else { toast.success('Password updated'); input.value = ''; }
                }}
              >
                Update Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="p-6 bg-secondary/20 border-border">
            <h3 className="text-lg font-semibold mb-4">Billing</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Stripe billing coming soon. Currently in free beta — generate as much as you like.
            </p>
            <Button variant="outline" disabled>
              <ExternalLink className="w-4 h-4 mr-2" /> Manage Subscription
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
