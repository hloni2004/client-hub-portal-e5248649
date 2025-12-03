import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UpdateTaskDialog } from '@/components/UpdateTaskDialog';
import { CreateTaskDialog } from '@/components/CreateTaskDialog';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { TaskStatus, UserRole, Task, Project } from '@/types';
import { Calendar, FileText, FolderOpen, Plus } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuthStore();
  const { tasks, loading, fetchTasks, fetchTasksByUser } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setUpdateDialogOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load projects first
        if (user.role === UserRole.CLIENT) {
          await fetchTasksByUser(user.userId);
        } else if (user.role === UserRole.STAFF) {
          await fetchTasksByUser(user.userId);
        } else {
          await fetchTasks();
        }
        // Load all projects to show project names
        await fetchProjects();
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [user]);

  const getStatusColor = (status: TaskStatus) => {
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

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.projectId;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.projectId === projectId);
    return project?.title || `Project #${projectId}`;
  };

  return (
    <Layout>
      <div className="content-spacing">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
            <p className="text-muted-foreground text-lg">View and manage tasks organized by project</p>
          </div>
          {user?.role === UserRole.ADMIN && (
            <Button onClick={() => setCreateTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Loading tasks...</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">No tasks assigned</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(tasksByProject).map(([projectId, projectTasks]) => (
              <AccordionItem key={projectId} value={projectId} className="border rounded-lg">
                <Card>
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <span className="text-lg font-semibold">{getProjectName(Number(projectId))}</span>
                      </div>
                      <Badge variant="outline" className="ml-4">
                        {projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Task</TableHead>
                            <TableHead className="w-[140px]">Status</TableHead>
                            <TableHead className="w-[120px]">Due Date</TableHead>
                            <TableHead className="w-[200px]">Deliverable</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectTasks.map((task) => (
                            <TableRow 
                              key={task.taskId} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleTaskClick(task)}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-base mb-1">{task.title}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {task.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(task.status)} variant="secondary">
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
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <UpdateTaskDialog 
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        task={selectedTask}
      />

      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        projectId={null}
      />
    </Layout>
  );
}
