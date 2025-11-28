import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { TaskStatus, UserRole } from '@/types';
import { Calendar } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuthStore();
  const { tasks, loading, fetchTasks, fetchTasksByUser } = useTaskStore();

  useEffect(() => {
    const loadTasks = async () => {
      if (!user) return;
      
      try {
        if (user.role === UserRole.CLIENT) {
          await fetchTasksByUser(user.userId);
        } else {
          await fetchTasks();
        }
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };

    loadTasks();
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

  const groupedTasks = {
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.IN_REVIEW]: tasks.filter(t => t.status === TaskStatus.IN_REVIEW),
    [TaskStatus.COMPLETED]: tasks.filter(t => t.status === TaskStatus.COMPLETED),
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Track and manage your tasks</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(groupedTasks).map(([status, taskList]) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{status.replace('_', ' ')}</span>
                  <Badge variant="outline">{taskList.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : taskList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks</p>
                ) : (
                  taskList.map((task) => (
                    <Card key={task.taskId} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                          <Badge className={`${getStatusColor(task.status)} text-xs`} variant="secondary">
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
