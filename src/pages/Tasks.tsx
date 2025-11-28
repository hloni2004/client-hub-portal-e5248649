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
      <div className="content-spacing">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
          <p className="text-muted-foreground text-lg">Track and manage your tasks</p>
        </div>

        <div className="grid-breathe md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(groupedTasks).map(([status, taskList]) => (
            <Card key={status}>
              <CardHeader className="card-spacing pb-4">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{status.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-sm">{taskList.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="card-spacing tight-spacing">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : taskList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks</p>
                ) : (
                  taskList.map((task) => (
                    <Card key={task.taskId} className="pad-comfortable hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]">
                      <div className="space-y-3">
                        <p className="font-medium text-base leading-relaxed">{task.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{task.description}</p>
                        <div className="flex items-center justify-between gap-2">
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
