import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Search, UserPlus, Mail, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function Staff() {
  const { user } = useAuthStore();
  const { staff, loading, fetchStaff, createUser, deactivateUser, resetPassword } = useUserStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchStaff();
    }
  }, [user]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setFormLoading(true);
    try {
      await createUser({
        ...formData,
        role: UserRole.STAFF,
      });

      toast({
        title: 'Success',
        description: 'Staff member added successfully',
      });

      setFormData({ name: '', email: '', password: '', phone: '' });
      setCreateDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to create staff:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add staff member',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
      toast({
        title: 'Success',
        description: 'Password reset email sent',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send password reset email',
      });
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to deactivate ${name}?`)) {
      try {
        await deactivateUser(id);
        toast({
          title: 'Success',
          description: 'Staff member deactivated',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to deactivate staff member',
        });
      }
    }
  };

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="content-spacing">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="content-spacing">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Staff Management</h1>
            <p className="text-muted-foreground text-lg">Manage staff members and permissions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Staff Members</CardTitle>
                <CardDescription>{staff.length} total staff members</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading staff...</p>
            ) : filteredStaff.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No staff members found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success text-success-foreground">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResetPassword(member.email)}>
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeactivate(member.userId, member.name)}
                              className="text-destructive"
                            >
                              Deactivate Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account with access to assigned tasks
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-name"
                  placeholder="Jane Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-phone">Phone</Label>
                <Input
                  id="staff-phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
