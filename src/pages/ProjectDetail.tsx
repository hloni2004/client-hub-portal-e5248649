import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { UploadDeliverableDialog } from '@/components/UploadDeliverableDialog';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDeliverableStore } from '@/stores/deliverableStore';
import { useAuthStore } from '@/stores/authStore';
import { ProjectStatus, TaskStatus, UserRole } from '@/types';
import { ArrowLeft, Calendar, Users, FileText, CheckCircle2, Plus, Upload, Download, Check, X } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentProject, fetchProjectById } = useProjectStore();
  const { tasks, fetchTasksByProject } = useTaskStore();
  const { deliverables, fetchDeliverablesByProject } = useDeliverableStore();
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [uploadDeliverableDialogOpen, setUploadDeliverableDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectById(Number(id));
      fetchTasksByProject(Number(id));
      fetchDeliverablesByProject(Number(id));
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

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-success text-success-foreground';
      case TaskStatus.IN_PROGRESS:
        return 'bg-primary text-primary-foreground';
      case TaskStatus.IN_REVIEW:
        return 'bg-accent text-accent-foreground';
      case TaskStatus.BLOCKED:
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Project Tasks</CardTitle>
                    <CardDescription className="text-base">{tasks.length} tasks in this project</CardDescription>
                  </div>
                  {user?.role === UserRole.ADMIN && (
                    <Button onClick={() => setCreateTaskDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground p-4">No tasks yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Task</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[120px]">Due Date</TableHead>
                        <TableHead className="w-[200px]">Deliverable</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.taskId} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-base mb-1">{task.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.deliverable ? (
                              <div className="flex items-center text-sm">
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="truncate">{task.deliverable}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {task.notes ? (
                              <p className="text-sm line-clamp-2">{task.notes}</p>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliverables">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Deliverables</CardTitle>
                    <CardDescription>Files and documents for this project</CardDescription>
                  </div>
                  {user?.role === UserRole.ADMIN && (
                    <Button onClick={() => setUploadDeliverableDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Deliverable
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {deliverables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No deliverables yet</p>
                    {user?.role === UserRole.ADMIN && (
                      <Button onClick={() => setUploadDeliverableDialogOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Your First Deliverable
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliverables.map((deliverable) => (
                        <TableRow key={deliverable.deliverableId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{deliverable.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{deliverable.fileType}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(deliverable.uploadedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {deliverable.approved ? (
                              <Badge className="bg-success text-success-foreground">
                                <Check className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <X className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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

      {currentProject && (
        <CreateTaskDialog
          open={createTaskDialogOpen}
          onOpenChange={setCreateTaskDialogOpen}
          projectId={currentProject.projectId}
        />
      )}

      {currentProject && (
        <UploadDeliverableDialog
          open={uploadDeliverableDialogOpen}
          onOpenChange={setUploadDeliverableDialogOpen}
          projectId={currentProject.projectId}
        />
      )}
    </Layout>
  );
}
