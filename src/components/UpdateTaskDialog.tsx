import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadDeliverableDialog } from '@/components/UploadDeliverableDialog';
import { useTaskStore } from '@/stores/taskStore';
import { useToast } from '@/hooks/use-toast';
import { TaskStatus, Task } from '@/types';
import { Loader2, Upload } from 'lucide-react';

interface UpdateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function UpdateTaskDialog({ open, onOpenChange, task }: UpdateTaskDialogProps) {
  const { updateTask } = useTaskStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadDeliverableOpen, setUploadDeliverableOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    deliverable: '',
    notes: '',
    dueDate: '',
  });

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        deliverable: task.deliverable || '',
        notes: task.notes || '',
        dueDate: task.dueDate.split('T')[0], // Format date for input
      });
    }
  }, [task]);

  const onSubmit = async () => {
    if (!task) return;

    setLoading(true);
    try {
      await updateTask(task.taskId, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        deliverable: formData.deliverable || undefined,
        notes: formData.notes || undefined,
        dueDate: formData.dueDate,
        assignedToId: task.assignedToId,
        projectId: task.projectId,
      });

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update task',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Task</DialogTitle>
          <DialogDescription>
            {task.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Task Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={TaskStatus.BLOCKED}>Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverable">Deliverable</Label>
            <div className="flex gap-2">
              <Input
                id="deliverable"
                placeholder="e.g., Requirements PDF, Design Mockup"
                value={formData.deliverable}
                onChange={(e) => setFormData({ ...formData, deliverable: e.target.value })}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setUploadDeliverableOpen(true)}
                title="Upload deliverable file"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Specify the expected deliverable or click upload to attach a file
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about progress, blockers, or updates..."
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
            <p className="font-semibold">Original Values:</p>
            <div className="grid grid-cols-2 gap-2">
              <p><strong>Status:</strong> {task.status.replace('_', ' ')}</p>
              <p><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>
              <p className="col-span-2">
                <strong>Deliverable:</strong> {task.deliverable || 'Not specified'}
              </p>
              <p className="col-span-2">
                <strong>Notes:</strong> {task.notes || 'No notes'}
              </p>
            </div>
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
          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Task
          </Button>
        </DialogFooter>
      </DialogContent>

      {task && (
        <UploadDeliverableDialog
          open={uploadDeliverableOpen}
          onOpenChange={setUploadDeliverableOpen}
          projectId={task.projectId}
          taskId={task.taskId}
          taskTitle={task.title}
        />
      )}
    </Dialog>
  );
}
