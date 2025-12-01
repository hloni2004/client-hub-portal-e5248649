import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/use-toast';
import { ProjectStatus } from '@/types';
import apiClient from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Client {
  clientId?: number;
  userId?: number;
  name: string;
  email: string;
}

interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface CreateProjectFormData {
  title: string;
  description: string;
  clientId: number;
  startDate: string;
  dueDate: string;
  status: ProjectStatus;
  assignedUsers: number[];
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateProjectFormData>({
    defaultValues: {
      status: ProjectStatus.NOT_STARTED,
      assignedUsers: [],
    }
  });
  const { createProject, fetchProjects } = useProjectStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch clients and users when dialog opens
  useEffect(() => {
    if (open) {
      fetchClients();
      fetchUsers();
    }
  }, [open]);

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/users/clients');
      // Map userId to clientId if needed
      const mappedClients = response.data.map((client: any) => ({
        ...client,
        clientId: client.clientId || client.userId,
      }));
      setClients(mappedClients);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load clients',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const onSubmit = async (data: CreateProjectFormData) => {
    setLoading(true);
    try {
      const projectData = {
        ...data,
        clientId: Number(data.clientId),
        assignedUsers: selectedUsers,
      };

      await createProject(projectData);
      await fetchProjects(); // Refresh the project list

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      reset();
      setSelectedUsers([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create project',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              placeholder="Enter project title"
              {...register('title', { required: 'Project title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter project description"
              rows={4}
              {...register('description')}
            />
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Assign Client *</Label>
            <Select onValueChange={(value) => setValue('clientId', Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <SelectItem value="0" disabled>No clients available</SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem 
                      key={client.clientId} 
                      value={client.clientId?.toString() || '0'}
                    >
                      {client.name} ({client.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-destructive">Client selection is required</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: 'Start date is required' })}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Project Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Project Status *</Label>
            <Select 
              defaultValue={ProjectStatus.NOT_STARTED}
              onValueChange={(value) => setValue('status', value as ProjectStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProjectStatus.NOT_STARTED}>Not Started</SelectItem>
                <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={ProjectStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <Label>Assign Team Members (Optional)</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users available</p>
              ) : (
                users.map((user) => (
                  <div key={user.userId} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.userId}`}
                      checked={selectedUsers.includes(user.userId)}
                      onChange={() => toggleUserSelection(user.userId)}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`user-${user.userId}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.name} ({user.email}) - {user.role}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedUsers.length} member(s)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedUsers([]);
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
