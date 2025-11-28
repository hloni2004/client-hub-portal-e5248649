import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function Deliverables() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deliverables</h1>
            <p className="text-muted-foreground">Upload and manage project deliverables</p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No deliverables yet</p>
            <Button>Upload your first deliverable</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
