import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, FileText, FolderOpen, CheckSquare, Users } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { useDeliverableStore } from '@/stores/deliverableStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import { ProjectStatus, TaskStatus } from '@/types';

export default function Search() {
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { deliverables } = useDeliverableStore();
  const { clients, staff } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setHasSearched(true);
  };

  const query = searchQuery.toLowerCase();

  const searchResults = {
    projects: projects.filter(
      p =>
        p.projectName.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.client?.name.toLowerCase().includes(query)
    ),
    tasks: tasks.filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.project?.projectName.toLowerCase().includes(query)
    ),
    deliverables: deliverables.filter(
      d =>
        d.fileName.toLowerCase().includes(query) ||
        d.project?.projectName.toLowerCase().includes(query)
    ),
    people: [...clients, ...staff].filter(
      u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.companyName?.toLowerCase().includes(query)
    ),
  };

  const totalResults =
    searchResults.projects.length +
    searchResults.tasks.length +
    searchResults.deliverables.length +
    searchResults.people.length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      [ProjectStatus.NOT_STARTED]: 'bg-gray-500 text-white',
      [ProjectStatus.IN_PROGRESS]: 'bg-blue-500 text-white',
      [ProjectStatus.ON_HOLD]: 'bg-yellow-500 text-white',
      [ProjectStatus.COMPLETED]: 'bg-success text-success-foreground',
      [ProjectStatus.CANCELLED]: 'bg-destructive text-destructive-foreground',
      [TaskStatus.TODO]: 'bg-gray-500 text-white',
      [TaskStatus.IN_PROGRESS]: 'bg-blue-500 text-white',
      [TaskStatus.COMPLETED]: 'bg-success text-success-foreground',
    };

    return (
      <Badge variant="outline" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="content-spacing">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Search</h1>
          <p className="text-muted-foreground text-lg">
            Search across projects, tasks, documents, and people
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for projects, tasks, documents, or people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                Found <span className="font-semibold">{totalResults}</span> results for "
                {searchQuery}"
              </p>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">
                  All Results
                  <Badge className="ml-2" variant="outline">
                    {totalResults}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="projects">
                  Projects
                  <Badge className="ml-2" variant="outline">
                    {searchResults.projects.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tasks
                  <Badge className="ml-2" variant="outline">
                    {searchResults.tasks.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="documents">
                  Documents
                  <Badge className="ml-2" variant="outline">
                    {searchResults.deliverables.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="people">
                  People
                  <Badge className="ml-2" variant="outline">
                    {searchResults.people.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {totalResults === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No results found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {searchResults.projects.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            Projects ({searchResults.projects.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {searchResults.projects.slice(0, 5).map((project) => (
                              <div
                                key={project.projectId}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                                onClick={() => navigate(`/projects/${project.projectId}`)}
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{project.projectName}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {project.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Client: {project.client?.name || '-'}
                                  </p>
                                </div>
                                {getStatusBadge(project.status)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {searchResults.tasks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckSquare className="h-5 w-5" />
                            Tasks ({searchResults.tasks.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {searchResults.tasks.slice(0, 5).map((task) => (
                              <div
                                key={task.taskId}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{task.title}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {task.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Project: {task.project?.projectName || '-'}
                                  </p>
                                </div>
                                {getStatusBadge(task.status)}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {searchResults.deliverables.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Documents ({searchResults.deliverables.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {searchResults.deliverables.slice(0, 5).map((deliverable) => (
                              <div
                                key={deliverable.deliverableId}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{deliverable.fileName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Project: {deliverable.project?.projectName || '-'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Uploaded: {new Date(deliverable.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={
                                    deliverable.approved
                                      ? 'bg-success text-success-foreground'
                                      : 'bg-warning text-warning-foreground'
                                  }
                                >
                                  {deliverable.approved ? 'Approved' : 'Pending'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {searchResults.people.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            People ({searchResults.people.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {searchResults.people.slice(0, 5).map((person) => (
                              <div
                                key={person.userId}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{person.name}</p>
                                  <p className="text-sm text-muted-foreground">{person.email}</p>
                                  {person.companyName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {person.companyName}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline">{person.role}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="projects">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Results</CardTitle>
                    <CardDescription>
                      {searchResults.projects.length} projects found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchResults.projects.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No projects found</p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.projects.map((project) => (
                          <div
                            key={project.projectId}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => navigate(`/projects/${project.projectId}`)}
                          >
                            <div className="flex-1">
                              <p className="font-medium">{project.projectName}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Client: {project.client?.name || '-'}
                              </p>
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Task Results</CardTitle>
                    <CardDescription>
                      {searchResults.tasks.length} tasks found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchResults.tasks.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No tasks found</p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.tasks.map((task) => (
                          <div
                            key={task.taskId}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Project: {task.project?.projectName || '-'}
                              </p>
                            </div>
                            {getStatusBadge(task.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Results</CardTitle>
                    <CardDescription>
                      {searchResults.deliverables.length} documents found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchResults.deliverables.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No documents found</p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.deliverables.map((deliverable) => (
                          <div
                            key={deliverable.deliverableId}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{deliverable.fileName}</p>
                              <p className="text-sm text-muted-foreground">
                                Project: {deliverable.project?.projectName || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploaded: {new Date(deliverable.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                deliverable.approved
                                  ? 'bg-success text-success-foreground'
                                  : 'bg-warning text-warning-foreground'
                              }
                            >
                              {deliverable.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="people">
                <Card>
                  <CardHeader>
                    <CardTitle>People Results</CardTitle>
                    <CardDescription>
                      {searchResults.people.length} people found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {searchResults.people.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No people found</p>
                    ) : (
                      <div className="space-y-3">
                        {searchResults.people.map((person) => (
                          <div
                            key={person.userId}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{person.name}</p>
                              <p className="text-sm text-muted-foreground">{person.email}</p>
                              {person.companyName && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {person.companyName}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">{person.role}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}
