import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { ProjectStatus } from '@/types';
import { ArrowLeft, Calendar, Users } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentProject, fetchProjectById } = useProjectStore();
  const { tasks, fetchTasksByProject } = useTaskStore();

  useEffect(() => {
    if (id) {
      fetchProjectById(Number(id));
      fetchTasksByProject(Number(id));
    }
  }, [id]);

  if (!currentProject) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </Layout>
    );
  }

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
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{currentProject.title}</h1>
            <p className="text-muted-foreground">{currentProject.description}</p>
          </div>
          <Badge className={getStatusColor(currentProject.status)} variant="secondary">
            {currentProject.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Date(currentProject.startDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Date(currentProject.dueDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{currentProject.progress}%</p>
                <Progress value={currentProject.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Tasks</CardTitle>
                <CardDescription>{tasks.length} tasks in this project</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.taskId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        </div>
                        <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverables">
            <Card>
              <CardHeader>
                <CardTitle>Deliverables</CardTitle>
                <CardDescription>Files and documents for this project</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No deliverables yet</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>People working on this project</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Team members coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
