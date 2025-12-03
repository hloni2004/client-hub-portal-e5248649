import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDeliverableStore } from '@/stores/deliverableStore';
import { Loader2, Upload } from 'lucide-react';

interface UploadDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  taskId?: number;
  taskTitle?: string;
}

export function UploadDeliverableDialog({ open, onOpenChange, projectId, taskId, taskTitle }: UploadDeliverableDialogProps) {
  const { uploadDeliverable } = useDeliverableStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a file to upload',
      });
      return;
    }

    if (!fileName) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a file name',
      });
      return;
    }

    setLoading(true);
    try {
      // In a real application, you would upload the file to a storage service
      // For now, we'll use a placeholder URL
      const fileType = file.type || file.name.split('.').pop() || 'unknown';
      const fileUrl = `/uploads/${projectId}/${file.name}`;

      await uploadDeliverable({
        fileName: fileName,
        fileType: fileType,
        fileUrl: fileUrl,
        projectId: projectId,
        taskId: taskId,
      });

      toast({
        title: 'Success',
        description: 'Deliverable uploaded successfully',
      });

      // Reset form
      setFile(null);
      setFileName('');
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to upload deliverable:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload deliverable',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Deliverable</DialogTitle>
          <DialogDescription>
            {taskTitle ? `Upload deliverable for task: ${taskTitle}` : 'Upload a project deliverable file'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">
                Deliverable Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fileName"
                placeholder="e.g., Requirements Document, Design Mockup"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="cursor-pointer"
                />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-start gap-2">
                <Upload className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Supported formats:</p>
                  <p>PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, ZIP</p>
                  <p className="mt-1">Maximum file size: 10MB</p>
                </div>
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
