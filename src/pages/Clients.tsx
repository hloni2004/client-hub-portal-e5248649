import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateClientDialog } from '@/components/CreateClientDialog';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Search, UserPlus, Mail, Phone, Building2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function Clients() {
  const { user } = useAuthStore();
  const { clients, loading, fetchClients, deactivateUser, resetPassword } = useUserStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchClients();
    }
  }, [user]);

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
          description: 'Client account deactivated',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to deactivate client account',
        });
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">Client Management</h1>
            <p className="text-muted-foreground text-lg">Manage client accounts and access</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Clients</CardTitle>
                <CardDescription>{clients.length} total clients</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading clients...</p>
            ) : filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No clients found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.companyName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {client.companyName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {client.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(client.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem onClick={() => handleResetPassword(client.email)}>
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeactivate(client.userId, client.name)}
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

      <CreateClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => fetchClients()}
      />
    </Layout>
  );
}
