import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { UserRole, ProjectStatus } from '@/types';
import { Search, Archive as ArchiveIcon, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

export default function Archive() {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchProjects();
    }
  }, [user]);

  const archivedProjects = projects.filter(
    p => p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.CANCELLED
  );

  const handleRestore = async (projectId: number) => {
    setLoading(true);
    try {
      await apiClient.put(`/projects/${projectId}/status`, null, {
        params: { status: ProjectStatus.IN_PROGRESS }
      });
      toast({
        title: 'Success',
        description: 'Project restored successfully',
      });
      fetchProjects();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to restore project',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (projectId: number, projectTitle: string) => {
    if (confirm(`Are you sure you want to permanently delete "${projectTitle}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await apiClient.delete(`/projects/${projectId}`);
        toast({
          title: 'Success',
          description: 'Project permanently deleted',
        });
        fetchProjects();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete project',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredProjects = archivedProjects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client?.name.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Project Archive</h1>
          <p className="text-muted-foreground text-lg">
            Manage completed and cancelled projects
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Archived Projects</CardTitle>
                <CardDescription>{archivedProjects.length} archived projects</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <ArchiveIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No archived projects found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.projectId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{project.client?.name || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            project.status === ProjectStatus.COMPLETED
                              ? 'bg-success text-success-foreground'
                              : 'bg-destructive text-destructive-foreground'
                          }
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(project.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestore(project.projectId)}
                            disabled={loading}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handlePermanentDelete(project.projectId, project.title)
                            }
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
