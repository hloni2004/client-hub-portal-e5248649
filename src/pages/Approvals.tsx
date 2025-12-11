import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDeliverableStore } from '@/stores/deliverableStore';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { CheckCircle, XCircle, Download, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Approvals() {
  const { user } = useAuthStore();
  const { deliverables, fetchDeliverables, approveDeliverable, deleteDeliverable } = useDeliverableStore();
  const { toast } = useToast();
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchDeliverables();
    }
  }, [user]);

  const pendingDeliverables = deliverables.filter(d => !d.approved);
  const approvedDeliverables = deliverables.filter(d => d.approved);

  const handleApprove = (id: number) => {
    setSelectedDeliverable(id);
    setActionType('approve');
    setFeedbackDialog(true);
  };

  const handleReject = (id: number) => {
    setSelectedDeliverable(id);
    setActionType('reject');
    setFeedbackDialog(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedDeliverable) return;

    try {
      if (actionType === 'approve') {
        await approveDeliverable(selectedDeliverable);
        toast({
          title: 'Success',
          description: feedback ? 'Deliverable approved with feedback' : 'Deliverable approved',
        });
      } else {
        await deleteDeliverable(selectedDeliverable);
        toast({
          title: 'Success',
          description: 'Deliverable rejected and removed',
        });
      }

      setFeedbackDialog(false);
      setFeedback('');
      setSelectedDeliverable(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${actionType} deliverable`,
      });
    }
  };

  const handleDownload = (filePath: string, fileName: string) => {
    window.open(`http://localhost:8080${filePath}`, '_blank');
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <Layout>
        <div className="content-spacing">
          <p className="text-muted-foreground">Access denied. Admin only.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="content-spacing">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Approvals & Feedback</h1>
          <p className="text-muted-foreground text-lg">Review and approve deliverables</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending Approval
              {pendingDeliverables.length > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {pendingDeliverables.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              <Badge className="ml-2" variant="outline">
                {approvedDeliverables.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Deliverables</CardTitle>
                <CardDescription>
                  Review and approve deliverables submitted by clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDeliverables.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending deliverables</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDeliverables.map((deliverable) => (
                        <TableRow key={deliverable.deliverableId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{deliverable.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{deliverable.project?.title || '-'}</TableCell>
                          <TableCell>
                            {deliverable.taskId ? (
                              <Badge variant="outline">Task #{deliverable.taskId}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(deliverable.uploadedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-warning text-warning-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(deliverable.filePath, deliverable.fileName)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(deliverable.deliverableId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(deliverable.deliverableId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Deliverables</CardTitle>
                <CardDescription>
                  Previously approved deliverables
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedDeliverables.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No approved deliverables yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedDeliverables.map((deliverable) => (
                        <TableRow key={deliverable.deliverableId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{deliverable.fileName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{deliverable.project?.title || '-'}</TableCell>
                          <TableCell>
                            {deliverable.taskId ? (
                              <Badge variant="outline">Task #{deliverable.taskId}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(deliverable.uploadedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-success text-success-foreground">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(deliverable.filePath, deliverable.fileName)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Deliverable' : 'Reject Deliverable'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Add optional feedback for the client (optional)'
                : 'Provide feedback explaining why this deliverable is being rejected'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                placeholder={actionType === 'approve' 
                  ? 'Great work! Approved for next phase...'
                  : 'Please revise and resubmit because...'}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleSubmitFeedback}
            >
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
