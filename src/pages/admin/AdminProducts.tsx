import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Product {
  productId: number;
  name: string;
  description: string;
  basePrice: number;
  comparePrice?: number;
  sku: string;
  category: {
    categoryId: number;
    name: string;
  };
  isActive: boolean;
  deletedAt?: string; // Soft delete timestamp
  images?: Array<{
    imageId: number;
    isPrimary: boolean;
    supabaseUrl?: string;
    imageUrl?: string;
  }>;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Get non-deleted products by default
      const response = await apiClient.get('/products/getAll');
      setProducts(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllIncludingDeleted = async () => {
    try {
      const response = await apiClient.get('/products/all');
      setProducts(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.delete(`/products/delete/${productToDelete}`);
      toast.success('Product deleted successfully');
      if (showDeleted) {
        fetchAllIncludingDeleted();
      } else {
        fetchProducts();
      }
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const handleRestore = async (productId: number) => {
    try {
      await apiClient.post(`/products/restore/${productId}`);
      toast.success('Product restored');
      if (showDeleted) {
        fetchAllIncludingDeleted();
      } else {
        fetchProducts();
      }
    } catch (error) {
      toast.error('Failed to restore product');
      console.error(error);
    }
  };

  const openDeleteDialog = (productId: number) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')}>
          Dashboard
        </Button>
        <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/products') : window.location.href = '/admin/products')}>
          Products
        </Button>
        <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/orders') : window.location.href = '/admin/orders')}>
          Orders
        </Button>
        <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/categories') : window.location.href = '/admin/categories')}>
          Categories
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Products</CardTitle>
              <CardDescription>Manage your product inventory</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (showDeleted) {
                    fetchProducts();
                    setShowDeleted(false);
                  } else {
                    fetchAllIncludingDeleted();
                    setShowDeleted(true);
                  }
                }}
              >
                {showDeleted ? 'Hide deleted' : 'Show deleted'}
              </Button>
              <Button onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/products/add') : window.location.href = '/admin/products/add')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={
                                product.images.find(img => img.isPrimary && (img.supabaseUrl || img.imageUrl))?.supabaseUrl ||
                                product.images.find(img => img.isPrimary && (img.supabaseUrl || img.imageUrl))?.imageUrl ||
                                product.images.find(img => img.supabaseUrl || img.imageUrl)?.supabaseUrl ||
                                product.images.find(img => img.supabaseUrl || img.imageUrl)?.imageUrl ||
                                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23e5e7eb" width="64" height="64"/></svg>'
                              }
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23e5e7eb" width="64" height="64"/></svg>';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                              No image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category?.name || 'N/A'}</TableCell>
                        <TableCell>R{product.basePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {product.deletedAt && (
                            <div className="text-xs text-destructive mt-1">Deleted</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => (typeof navigate !== 'undefined' ? navigate(`/product/${product.productId}`) : window.location.href = `/product/${product.productId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {!product.deletedAt && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => (typeof navigate !== 'undefined' ? navigate(`/admin/products/edit/${product.productId}`) : window.location.href = `/admin/products/edit/${product.productId}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {!product.deletedAt && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(product.productId)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {product.deletedAt && (
                              <Button variant="ghost" size="icon" onClick={() => handleRestore(product.productId)}>
                                <Eye className="h-4 w-4 text-success" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and all its associated data (images, colors, sizes).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
