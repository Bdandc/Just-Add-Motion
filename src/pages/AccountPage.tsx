import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  ExternalLink,
  Settings,
  ShieldCheck,
  History
} from 'lucide-react';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const generations = [
    { id: 1, date: 'Mar 24, 2026', prompt: 'Slow cinematic zoom in, dust particles...', duration: '5s', status: 'Complete' },
    { id: 2, date: 'Mar 22, 2026', prompt: 'Parallax drift left, warm sunset...', duration: '3s', status: 'Complete' },
    { id: 3, date: 'Mar 21, 2026', prompt: 'Particles floating up, dark aesthetic...', duration: '8s', status: 'Failed' },
    { id: 4, date: 'Mar 15, 2026', prompt: 'Cinematic pan right, forest scene...', duration: '5s', status: 'Complete' },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, usage, and billing</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-primary/30 text-primary bg-primary/5">
          Pro Plan
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-8" onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 p-1 border border-border/50">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            <User className="w-4 h-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-background">
            <BarChart3 className="w-4 h-4 mr-2" /> Usage
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-background">
            <CreditCard className="w-4 h-4 mr-2" /> Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-secondary/20 border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue="john@example.com" readOnly className="bg-muted/50 border-border cursor-not-allowed" />
                <p className="text-[10px] text-muted-foreground">Email cannot be changed. Contact support for assistance.</p>
              </div>
            </div>
            <Button className="mt-8 gradient-bg">Save Changes</Button>
          </Card>

          <Card className="p-6 bg-secondary/20 border-border">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Security
            </h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="bg-background border-border" />
              </div>
              <Button variant="outline">Update Password</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-secondary/20 border-border md:col-span-2">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Current Period</p>
                  <h3 className="text-xl font-bold">March 2026</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">12</span>
                  <span className="text-muted-foreground"> / 300</span>
                </div>
              </div>
              <Progress value={4} className="h-2 mb-4" />
              <p className="text-xs text-muted-foreground">You have used 4% of your monthly generation limit.</p>
            </Card>
            
            <Card className="p-6 bg-primary/10 border-primary/20 flex flex-col justify-center">
              <p className="text-sm font-medium mb-1">Need more?</p>
              <p className="text-xs text-muted-foreground mb-4">Upgrade to Business for unlimited generations.</p>
              <Button size="sm" className="w-full gradient-bg">View Plans</Button>
            </Card>
          </div>

          <Card className="bg-secondary/20 border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Recent Generations
              </h3>
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generations.map((gen) => (
                  <TableRow key={gen.id}>
                    <TableCell className="text-sm">{gen.date}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{gen.prompt}</TableCell>
                    <TableCell className="text-sm">{gen.duration}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={gen.status === 'Complete' ? 'default' : gen.status === 'Failed' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-2 py-0"
                      >
                        {gen.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {gen.status === 'Complete' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-secondary/20 border-border">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-primary">Pro Monthly</h4>
                  <span className="text-lg font-bold">£29/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">Next billing date: April 15, 2026</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">Change Plan</Button>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">Cancel</Button>
              </div>
            </Card>

            <Card className="p-6 bg-secondary/20 border-border">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background mb-6">
                <div className="w-12 h-8 bg-muted rounded flex items-center justify-center font-bold text-[10px]">VISA</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Visa ending in •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/28</p>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
              <Button variant="outline" className="w-full">Add New Method</Button>
            </Card>
          </div>

          <Card className="bg-secondary/20 border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold">Invoice History</h3>
            </div>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { id: 'INV-001', date: 'Mar 15, 2026', amount: '£29.00', status: 'Paid' },
                  { id: 'INV-002', date: 'Feb 15, 2026', amount: '£29.00', status: 'Paid' },
                  { id: 'INV-003', date: 'Jan 15, 2026', amount: '£29.00', status: 'Paid' },
                ].map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm font-mono">{inv.id}</TableCell>
                    <TableCell className="text-sm">{inv.date}</TableCell>
                    <TableCell className="text-sm">{inv.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 bg-green-500/5">
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
