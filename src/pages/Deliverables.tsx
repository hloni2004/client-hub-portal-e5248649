import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  FileImage, 
  FileCode, 
  File,
  Calendar,
  Archive,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function Deliverables() {
  // TODO: Replace with actual data from API/store
  const deliverables: any[] = [];

  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf' || type === 'docx' || type === 'doc') return FileText;
    if (type === 'png' || type === 'jpg' || type === 'jpeg' || type === 'gif') return FileImage;
    if (type === 'zip' || type === 'js' || type === 'ts' || type === 'jsx' || type === 'tsx') return FileCode;
    return File;
  };

  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((deliverable) => {
      // Search filter
      const matchesSearch = deliverable.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           deliverable.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // File type filter
      const matchesFileType = fileTypeFilter === 'all' || 
                             deliverable.fileType.toLowerCase() === fileTypeFilter.toLowerCase();
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'approved' && deliverable.approved) ||
                           (statusFilter === 'pending' && !deliverable.approved);
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange !== 'all') {
        const uploadDate = new Date(deliverable.uploadedAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateRange === '7days') matchesDateRange = daysDiff <= 7;
        else if (dateRange === '30days') matchesDateRange = daysDiff <= 30;
        else if (dateRange === '90days') matchesDateRange = daysDiff <= 90;
      }

      // Archive filter
      const matchesArchive = showArchived ? deliverable.archived : !deliverable.archived;

      return matchesSearch && matchesFileType && matchesStatus && matchesDateRange && matchesArchive;
    });
  }, [searchQuery, fileTypeFilter, statusFilter, dateRange, showArchived]);

  const fileTypes = ['all', 'pdf', 'png', 'jpg', 'docx', 'zip'];
  
  return (
    <Layout>
      <div className="content-spacing">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Deliverables</h1>
            <p className="text-muted-foreground text-lg">Upload and manage project deliverables</p>
          </div>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="card-spacing">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files or projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* File Type Filter */}
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="File Type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {fileTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="Date Range" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Archive Toggle */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Archive className="h-4 w-4" />
                <span>Showing {filteredDeliverables.length} of {deliverables.length} files</span>
              </div>
              <Button 
                variant={showArchived ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deliverables List */}
        {filteredDeliverables.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || fileTypeFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all'
                  ? 'No deliverables match your filters'
                  : 'No deliverables yet'}
              </p>
              {!searchQuery && fileTypeFilter === 'all' && statusFilter === 'all' && (
                <Button>Upload your first deliverable</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid-breathe">
            {filteredDeliverables.map((deliverable) => {
              const FileIcon = getFileIcon(deliverable.fileType);
              return (
                <Card key={deliverable.deliverableId} className="hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1 truncate">{deliverable.fileName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{deliverable.projectName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={deliverable.approved ? "default" : "secondary"} className="flex items-center gap-1">
                          {deliverable.approved ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                        {deliverable.archived && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Archive className="h-3 w-3" />
                            Archived
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(deliverable.uploadedAt).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {deliverable.fileType}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
