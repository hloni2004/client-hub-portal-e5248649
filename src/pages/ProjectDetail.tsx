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
      <div className="content-spacing">
        <div className="flex items-start gap-4 mb-8">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{currentProject.title}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{currentProject.description}</p>
          </div>
          <Badge className={getStatusColor(currentProject.status)} variant="secondary">
            {currentProject.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid-breathe md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
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

        <Tabs defaultValue="tasks" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader className="card-spacing pb-4">
                <CardTitle className="text-xl">Project Tasks</CardTitle>
                <CardDescription className="text-base">{tasks.length} tasks in this project</CardDescription>
              </CardHeader>
              <CardContent className="card-spacing tight-spacing">
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground">No tasks yet</p>
                ) : (
                  <div className="tight-spacing">
                    {tasks.map((task) => (
                      <Link key={task.taskId} to="/tasks">
                        <div className="flex items-center justify-between pad-comfortable border rounded-lg hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-medium text-base mb-1">{task.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                          <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                        </div>
                      </Link>
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
