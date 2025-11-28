import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { ProjectStatus, UserRole } from '@/types';
import { Plus, Calendar } from 'lucide-react';

export default function Projects() {
  const { user } = useAuthStore();
  const { projects, loading, fetchProjects, fetchProjectsByClient } = useProjectStore();

  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      
      try {
        if (user.role === UserRole.CLIENT) {
          await fetchProjectsByClient(user.userId);
        } else {
          await fetchProjects();
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, [user]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return 'bg-success text-success-foreground';
      case ProjectStatus.IN_PROGRESS:
        return 'bg-primary text-primary-foreground';
      case ProjectStatus.ON_HOLD:
        return 'bg-warning text-warning-foreground';
      case ProjectStatus.CANCELLED:
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage and track your projects</p>
          </div>
          {user?.role === UserRole.ADMIN && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects found</p>
              {user?.role === UserRole.ADMIN && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.projectId} to={`/projects/${project.projectId}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {new Date(project.dueDate).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
