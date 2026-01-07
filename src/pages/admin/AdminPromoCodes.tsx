import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/lib/api';
import { Loader2, Plus, Edit, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromoCode {
  promoId: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string | null;
  endDate: string | null;
  usageLimit: number | null;
  currentUsage: number;
  minPurchaseAmount: number | null;
  isActive: boolean;
  perUserUsageLimit: number | null;
  description: string;
  createdAt: string;
}

interface Product {
  productId: number;
  name: string;
  basePrice: number;
  sku: string;
}

interface PromoData {
  promo: PromoCode;
  eligibleProductIds: number[];
}

export default function AdminPromoCodes() {
  const navigate = useNavigate();
  const [promos, setPromos] = useState<PromoData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoData | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: null as number | null,
    minPurchaseAmount: null as number | null,
    isActive: true,
    perUserUsageLimit: null as number | null,
    description: '',
    productIds: [] as number[],
  });

  useEffect(() => {
    fetchPromos();
    fetchProducts();
  }, []);

  const fetchPromos = async () => {
    try {
      const response = await apiClient.get('/promos/getAll');
      setPromos(response.data);
    } catch (error) {
      console.error('Error fetching promos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load promo codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products/getAll');
      // Handle different response structures
      const productsData = response.data?.data || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleOpenDialog = (promoData?: PromoData) => {
    if (promoData) {
      setSelectedPromo(promoData);
      const promo = promoData.promo;
      setFormData({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        startDate: promo.startDate ? promo.startDate.substring(0, 16) : '',
        endDate: promo.endDate ? promo.endDate.substring(0, 16) : '',
        usageLimit: promo.usageLimit,
        minPurchaseAmount: promo.minPurchaseAmount,
        isActive: promo.isActive,
        perUserUsageLimit: promo.perUserUsageLimit,
        description: promo.description || '',
        productIds: promoData.eligibleProductIds,
      });
    } else {
      setSelectedPromo(null);
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        startDate: '',
        endDate: '',
        usageLimit: null,
        minPurchaseAmount: null,
        isActive: true,
        perUserUsageLimit: null,
        description: '',
        productIds: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedPromo(null);
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      startDate: '',
      endDate: '',
      usageLimit: null,
      minPurchaseAmount: null,
      isActive: true,
      perUserUsageLimit: null,
      description: '',
      productIds: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.code.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Promo code is required',
          variant: 'destructive',
        });
        return;
      }

      if (formData.discountValue <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Discount value must be greater than 0',
          variant: 'destructive',
        });
        return;
      }

      if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
        toast({
          title: 'Validation Error',
          description: 'Percentage discount cannot exceed 100%',
          variant: 'destructive',
        });
        return;
      }

      try {
        setSubmitting(true);

        const payload = {
          ...formData,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        };

        if (selectedPromo) {
          await apiClient.put(`/promos/update/${selectedPromo.promo.promoId}`, payload);
          toast({
            title: 'Success',
            description: 'Promo code updated successfully',
          });
        } else {
          await apiClient.post('/promos/create', payload);
          toast({
            title: 'Success',
            description: 'Promo code created successfully',
          });
        }

        handleCloseDialog();
        fetchPromos();
      } catch (error: any) {
        console.error('Error saving promo:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to save promo code',
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
  };

  const handleDeleteClick = (promoId: number) => {
    setPromoToDelete(promoId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promoToDelete) return;

    try {
      await apiClient.delete(`/promos/delete/${promoToDelete}`);
      toast({
        title: 'Success',
        description: 'Promo code deleted successfully',
      });
      fetchPromos();
    } catch (error) {
      console.error('Error deleting promo:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete promo code',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setPromoToDelete(null);
    }
  };

  const toggleProductSelection = (productId: number) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Promo Codes</h1>
            <p className="text-muted-foreground">Manage discount codes and promotions</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Promo Code
          </Button>
        </div>
      </div>
      {/* Promo Codes Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Valid Period</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No promo codes yet. Create your first promotion!</p>
                </TableCell>
              </TableRow>
            ) : (
              promos.map((promoData) => {
                const promo = promoData.promo;
                return (
                  <TableRow key={promo.promoId}>
                    <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                    <TableCell>
                      {promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}%`
                        : `R${promo.discountValue.toFixed(2)}`}
                      {promo.minPurchaseAmount && (
                        <div className="text-xs text-muted-foreground">
                          Min: R{promo.minPurchaseAmount.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{formatDate(promo.startDate)}</div>
                      <div className="text-muted-foreground">{formatDate(promo.endDate)}</div>
                    </TableCell>
                    <TableCell>
                      {promo.currentUsage}
                      {promo.usageLimit && ` / ${promo.usageLimit}`}
                    </TableCell>
                    <TableCell>
                      {promoData.eligibleProductIds.length === 0 ? (
                        <span className="text-muted-foreground">All</span>
                      ) : (
                        <span>{promoData.eligibleProductIds.length} selected</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(promoData)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(promo.promoId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPromo ? 'Edit' : 'Create'} Promo Code</DialogTitle>
            <DialogDescription>
              {selectedPromo ? 'Update' : 'Create a new'} discount code for customers
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Promo Code *</Label>
                    <Input
                      id="code"
                      placeholder="SUMMER20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                        setFormData({ ...formData, discountType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FIXED">Fixed Amount (R)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(R)'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      value={formData.discountValue || ''}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minPurchase">Minimum Purchase (R)</Label>
                    <Input
                      id="minPurchase"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      value={formData.minPurchaseAmount || ''}
                      onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : null })}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.usageLimit || ''}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum total uses across all users
                  </p>
                </div>

                {/* Per User Usage Limit */}
                <div className="space-y-2">
                  <Label htmlFor="perUserUsageLimit">Per-User Usage Limit</Label>
                  <Input
                    id="perUserUsageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited per user"
                    value={formData.perUserUsageLimit || ''}
                    onChange={(e) => setFormData({ ...formData, perUserUsageLimit: e.target.value ? parseInt(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum times each user can use this code
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Internal notes about this promo code"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                {/* Product Selection */}
                <div className="space-y-2">
                  <Label>Eligible Products</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Leave empty to apply to all products, or select specific products
                  </p>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                    {products.map((product) => (
                      <div key={product.productId} className="flex items-center space-x-2">
                        <Checkbox
                          id={`product-${product.productId}`}
                          checked={formData.productIds.includes(product.productId)}
                          onCheckedChange={() => toggleProductSelection(product.productId)}
                        />
                        <label
                          htmlFor={`product-${product.productId}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {product.name} - R{product.basePrice.toFixed(2)} ({product.sku})
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.productIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formData.productIds.length} product(s) selected
                    </p>
                  )}
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{selectedPromo ? 'Update' : 'Create'} Promo Code</>
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
              This action cannot be undone. This will permanently delete the promo code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
