import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateStaffDialog } from '@/components/CreateStaffDialog';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { FolderKanban, CheckSquare, FileUp, Bell, ArrowRight, UserPlus, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ProjectStatus, TaskStatus, UserRole } from '@/types';
import apiClient from '@/lib/api';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { projects, fetchProjects, fetchProjectsByClient } = useProjectStore();
  const { tasks, fetchTasks, fetchTasksByUser } = useTaskStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [createStaffDialogOpen, setCreateStaffDialogOpen] = useState(false);
  const [staffCount, setStaffCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        if (user.role === UserRole.CLIENT) {
          await fetchProjectsByClient(user.userId);
          await fetchTasksByUser(user.userId);
        } else {
          await fetchProjects();
          await fetchTasks();
        }
        await fetchUnreadCount(user.userId);
        
        // Fetch staff count for admin
        if (user.role === UserRole.ADMIN) {
          const response = await apiClient.get('/users/role/STAFF');
          setStaffCount(response.data.length);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleStaffCreated = async () => {
    // Refresh staff count
    if (user?.role === UserRole.ADMIN) {
      try {
        const response = await apiClient.get('/users/role/STAFF');
        setStaffCount(response.data.length);
      } catch (error) {
        console.error('Failed to refresh staff count:', error);
      }
    }
  };

  const activeProjects = projects.filter(p => p.status === ProjectStatus.IN_PROGRESS);
  const activeTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  // Filter projects based on selected tab
  const filteredProjects = projectFilter === 'all' 
    ? projects 
    : projects.filter(p => p.status === projectFilter as ProjectStatus);

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
      <div className="content-spacing">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground text-lg">Here's what's happening with your projects today.</p>
        </div>

        <div className="grid-breathe md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold mb-1">{projects.length}</div>
              <p className="text-sm text-muted-foreground">{activeProjects.length} active</p>
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

          {user?.role === UserRole.ADMIN ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffCount}</div>
                <Button 
                  variant="link" 
                  className="text-xs p-0 h-auto text-primary hover:underline"
                  onClick={() => setCreateStaffDialogOpen(true)}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add Staff Member
                </Button>
              </CardContent>
            </Card>
          ) : (
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
          )}

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

        <div className="grid-breathe md:grid-cols-2 mt-8">
          <Card>
            <CardHeader className="card-spacing pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Projects</CardTitle>
                <Tabs value={projectFilter} onValueChange={setProjectFilter}>
                  <TabsList className="h-8">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value={ProjectStatus.IN_PROGRESS} className="text-xs">Active</TabsTrigger>
                    <TabsTrigger value={ProjectStatus.COMPLETED} className="text-xs">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="card-spacing tight-spacing">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : filteredProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              ) : (
                <div className="tight-spacing">
                  {filteredProjects.slice(0, 5).map((project) => (
                    <Link key={project.projectId} to={`/projects/${project.projectId}`}>
                      <div className="space-y-3 py-3 border-b last:border-0 hover:bg-muted/50 px-3 -mx-3 rounded transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base mb-1 truncate">{project.title}</p>
                            <p className="text-sm text-muted-foreground">Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                          </div>
                          <Badge className={getStatusColor(project.status)} variant="secondary">
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {filteredProjects.length > 0 && (
                <Link to="/projects">
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    View All Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="card-spacing pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Tasks</CardTitle>
                <Link to="/tasks">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="card-spacing tight-spacing">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                <div className="tight-spacing">
                  {tasks.slice(0, 5).map((task) => (
                    <Link key={task.taskId} to="/tasks">
                      <div className="flex items-center justify-between py-3 px-3 -mx-3 border-b last:border-0 hover:bg-muted/50 rounded transition-colors">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium text-base mb-1 truncate">{task.title}</p>
                          <p className="text-sm text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateStaffDialog 
        open={createStaffDialogOpen}
        onOpenChange={setCreateStaffDialogOpen}
        onSuccess={handleStaffCreated}
      />
    </Layout>
  );
}
