import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTaskStore } from '@/stores/taskStore';
import { useProjectStore } from '@/stores/projectStore';
import { TaskStatus, User } from '@/types';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number | null;
}

export function CreateTaskDialog({ open, onOpenChange, projectId }: CreateTaskDialogProps) {
  const { createTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    projectId: projectId?.toString() || '',
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    deliverable: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      // Fetch staff members and projects when dialog opens
      const fetchData = async () => {
        try {
          const [staffResponse] = await Promise.all([
            apiClient.get('/users/role/STAFF'),
            projects.length === 0 ? fetchProjects() : Promise.resolve(),
          ]);
          setStaffMembers(staffResponse.data);
          
          // Set projectId if provided
          if (projectId) {
            setFormData(prev => ({ ...prev, projectId: projectId.toString() }));
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
        }
      };
      fetchData();
    }
  }, [open, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.title || !formData.description || !formData.assignedToId || !formData.dueDate) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    setLoading(true);
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        projectId: Number(formData.projectId),
        assignedToId: Number(formData.assignedToId),
        dueDate: formData.dueDate,
        deliverable: formData.deliverable || undefined,
        notes: formData.notes || undefined,
      });

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      // Reset form
      setFormData({
        projectId: projectId?.toString() || '',
        title: '',
        description: '',
        assignedToId: '',
        dueDate: '',
        deliverable: '',
        notes: '',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create task',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.projectId} value={project.projectId.toString()}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Gather Requirements"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what needs to be done..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">
                  Assign To <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.assignedToId}
                  onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.userId} value={staff.userId.toString()}>
                        {staff.name} ({staff.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  Due Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverable">Deliverable (Optional)</Label>
              <Input
                id="deliverable"
                placeholder="e.g., Requirements PDF, Design Mockup"
                value={formData.deliverable}
                onChange={(e) => setFormData({ ...formData, deliverable: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Specify the expected deliverable for this task
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or instructions..."
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
