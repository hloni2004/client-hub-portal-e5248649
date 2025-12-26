import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { useProductStore } from '@/stores/ecommerce/productStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
  categoryId: number;
  name: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  parentCategory?: Category;
  subCategory?: Category[];
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/categories/getAll');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        isActive: category.isActive,
      });
      setImagePreview(category.imageUrl || '');
      setImageFile(null);
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        isActive: true,
      });
      setImagePreview('');
      setImageFile(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare category data (do not embed raw base64 in JSON)
      const categoryData = {
        name: formData.name,
        description: formData.description || '',
        imageUrl: '', // image will be uploaded separately as multipart
        isActive: formData.isActive,
      };

      console.log('Submitting category data (without file):', categoryData);

      if (selectedCategory) {
        // Update existing category first
        const response = await apiClient.put('/categories/update', {
          categoryId: selectedCategory.categoryId,
          ...categoryData,
        });

        console.log('Update response:', response.data);

        if (response.data && response.data.success) {
          // If file selected, upload via multipart to new endpoint
          if (imageFile) {
            try {
              const fd = new FormData();
              fd.append('file', imageFile);
              const uploadResp = await apiClient.post(`/categories/upload/${selectedCategory.categoryId}`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              console.log('Upload response:', uploadResp.data);
            } catch (uploadError: any) {
              console.error('Image upload error:', uploadError.response?.data || uploadError);
              toast({ title: 'Error', description: uploadError.response?.data?.message || 'Image upload failed', variant: 'destructive' });
            }
          }

          toast({ title: 'Success', description: 'Category updated successfully' });
          fetchCategories();
          const productStore = useProductStore.getState();
          useProductStore.setState({ categories: [] });
          productStore.fetchCategories();
          handleCloseDialog();
        }
      } else {
        // Create new category first (without file)
        const response = await apiClient.post('/categories/create', categoryData);
        console.log('Create response:', response.data);

        // Response body should contain created Category
        const createdCategory = response.data;
        // If file selected, upload it using the returned categoryId
        if (imageFile && createdCategory && createdCategory.categoryId) {
          try {
            const fd = new FormData();
            fd.append('file', imageFile);
            const uploadResp = await apiClient.post(`/categories/upload/${createdCategory.categoryId}`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            console.log('Upload response:', uploadResp.data);
          } catch (uploadError: any) {
            console.error('Image upload error:', uploadError.response?.data || uploadError);
            toast({ title: 'Error', description: uploadError.response?.data?.message || 'Image upload failed', variant: 'destructive' });
          }
        }

        if (response.status === 201 || response.data) {
          toast({ title: 'Success', description: 'Category created successfully' });
          fetchCategories();
          const productStore = useProductStore.getState();
          useProductStore.setState({ categories: [] });
          productStore.fetchCategories();
          handleCloseDialog();
        }
      }
    } catch (error: any) {
      console.error('Error saving category:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setCategoryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setSubmitting(true);
      await apiClient.delete(`/categories/delete/${categoryToDelete}`);
      
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      
      fetchCategories();
      // Clear the product store cache to refetch updated categories
      const productStore = useProductStore.getState();
      useProductStore.setState({ categories: [] });
      productStore.fetchCategories();
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete category. It may have associated products.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
          Dashboard
        </Button>
        <Button variant="ghost" onClick={() => navigate('/admin/products')}>
          Products
        </Button>
        <Button variant="ghost" onClick={() => navigate('/admin/orders')}>
          Orders
        </Button>
        <Button variant="ghost" onClick={() => navigate('/admin/categories')}>
          Categories
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your product categories
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found. Create your first category to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.categoryId}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-md">
                    {category.description ? (
                      <span className="line-clamp-2">{category.description}</span>
                    ) : (
                      <span className="text-muted-foreground italic">No description</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {category.subCategory?.length || 0} subcategories
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(category.categoryId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? 'Update the category details below'
                : 'Fill in the details to create a new category'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Electronics, Clothing, Books"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categoryImage">Category Image</Label>
                <Input
                  id="categoryImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Basic client-side validation
                      if (!file.type.startsWith('image/')) {
                        toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' });
                        return;
                      }
                      const maxSize = 2 * 1024 * 1024; // 2MB
                      if (file.size > maxSize) {
                        toast({ title: 'File too large', description: 'Please use an image smaller than 2MB', variant: 'destructive' });
                        return;
                      }

                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{selectedCategory ? 'Update' : 'Create'} Category</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
              If this category has associated products, the deletion may fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
