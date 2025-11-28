import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { FolderKanban, CheckSquare, FileUp, Bell } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProjectStatus, TaskStatus } from '@/types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { projects, fetchProjects, fetchProjectsByClient } = useProjectStore();
  const { tasks, fetchTasks, fetchTasksByUser } = useTaskStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        if (user.role === 'CLIENT') {
          await fetchProjectsByClient(user.userId);
          await fetchTasksByUser(user.userId);
        } else {
          await fetchProjects();
          await fetchTasks();
        }
        await fetchUnreadCount(user.userId);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS);
  const activeTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return 'bg-success text-success-foreground';
      case ProjectStatus.IN_PROGRESS:
        return 'bg-primary text-primary-foreground';
      case ProjectStatus.ON_HOLD:
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">{activeProjects.length} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTasks.length}</div>
              <p className="text-xs text-muted-foreground">{completedTasks.length} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Deliverables</CardTitle>
              <FileUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <div key={project.projectId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)} variant="secondary">
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                tasks.slice(0, 5).map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
