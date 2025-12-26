import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  basePrice: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().optional(),
  sku: z.string().min(1, 'SKU is required'),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  categoryId: z.number().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  categoryId: number;
  name: string;
}

interface ProductColour {
  name: string;
  hexCode: string;
  sizes: ProductSize[];
}

interface ProductSize {
  sizeName: string;
  stockQuantity: number;
}

interface ImageFile {
  file: File;
  preview: string;
  base64: string;
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [colours, setColours] = useState<ProductColour[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
    },
  });

  useEffect(() => {
    fetchCategories();
    // Generate SKU on mount
    const sku = `PRD-${Date.now().toString().slice(-8)}`;
    setValue('sku', sku);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/categories/getAll');
      setCategories(response.data.data || response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await convertToBase64(file);
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        base64,
      });
    }
    
    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const addColour = () => {
    setColours([...colours, { name: '', hexCode: '#000000', sizes: [] }]);
  };

  const removeColour = (index: number) => {
    setColours(colours.filter((_, i) => i !== index));
  };

  const updateColour = (index: number, field: keyof ProductColour, value: any) => {
    const newColours = [...colours];
    newColours[index] = { ...newColours[index], [field]: value };
    setColours(newColours);
  };

  const addSize = (colourIndex: number) => {
    const newColours = [...colours];
    newColours[colourIndex].sizes.push({ sizeName: '', stockQuantity: 0 });
    setColours(newColours);
  };

  const removeSize = (colourIndex: number, sizeIndex: number) => {
    const newColours = [...colours];
    newColours[colourIndex].sizes = newColours[colourIndex].sizes.filter((_, i) => i !== sizeIndex);
    setColours(newColours);
  };

  const updateSize = (colourIndex: number, sizeIndex: number, field: keyof ProductSize, value: any) => {
    const newColours = [...colours];
    newColours[colourIndex].sizes[sizeIndex] = {
      ...newColours[colourIndex].sizes[sizeIndex],
      [field]: value,
    };
    setColours(newColours);
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      if (images.length === 0) {
        toast.error('Please add at least one product image');
        setLoading(false);
        return;
      }

      if (colours.length === 0) {
        toast.error('Please add at least one colour with sizes');
        setLoading(false);
        return;
      }

      // Step 1: Create product without images
      const productData = {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        comparePrice: data.comparePrice || 0,
        sku: data.sku,
        weight: data.weight || 0,
        categoryId: data.categoryId,
        isActive: data.isActive,
        imageBase64List: [], // Don't send Base64 images anymore
        colours: colours.map(colour => ({
          name: colour.name,
          hexCode: colour.hexCode,
          sizes: colour.sizes.map(size => ({
            sizeName: size.sizeName,
            stockQuantity: size.stockQuantity,
          })),
        })),
      };

      console.log('Creating product...');
      const response = await apiClient.post('/products/create', productData);
      const createdProduct = response.data.data || response.data;
      const productId = createdProduct.productId;

      console.log('Product created with ID:', productId);

      // Step 2: Upload images to Supabase Storage
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => {
          formData.append('files', img.file);
        });

        console.log('Uploading', images.length, 'images to Supabase...');
        await apiClient.post(`/product-images/upload/${productId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Images uploaded successfully');
      }

      toast.success('Product created successfully with images!');
      
      // Navigate back to products page after 1 second
      setTimeout(() => {
        if (typeof navigate !== 'undefined') navigate('/admin/products'); else window.location.href = '/admin/products';
      }, 1000);
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/products') : window.location.href = '/admin/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')}>
            Dashboard
          </Button>
          <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/products') : window.location.href = '/admin/products')}>
            Products
          </Button>
          <Button variant="ghost" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/categories') : window.location.href = '/admin/categories')}>
            Categories
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Product</CardTitle>
          <CardDescription>Create a new product for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" {...register('sku')} />
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" rows={4} {...register('description')} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    {...register('basePrice', { valueAsNumber: true })}
                  />
                  {errors.basePrice && <p className="text-sm text-destructive">{errors.basePrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    {...register('comparePrice', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    {...register('weight', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => setValue('categoryId', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      defaultChecked
                      onCheckedChange={(checked) => setValue('isActive', checked)}
                    />
                    <Label htmlFor="isActive" className="font-normal">Active</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Product Images</h3>
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Images
                    </span>
                  </Button>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Product ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">No images uploaded yet</p>
                  <p className="text-xs text-gray-500">Click "Upload Images" to add product photos</p>
                </div>
              )}
            </div>

            {/* Colours and Sizes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Colours & Sizes</h3>
                <Button type="button" variant="outline" size="sm" onClick={addColour}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Colour
                </Button>
              </div>

              {colours.map((colour, colourIndex) => (
                <Card key={colourIndex}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="grid gap-4 md:grid-cols-2 flex-1">
                        <div className="space-y-2">
                          <Label>Colour Name</Label>
                          <Input
                            placeholder="e.g., Navy Blue"
                            value={colour.name}
                            onChange={(e) => updateColour(colourIndex, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Colour Code</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={colour.hexCode}
                              onChange={(e) => updateColour(colourIndex, 'hexCode', e.target.value)}
                              className="w-20"
                            />
                            <Input
                              value={colour.hexCode}
                              onChange={(e) => updateColour(colourIndex, 'hexCode', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColour(colourIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sizes</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addSize(colourIndex)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Size
                        </Button>
                      </div>

                      {colour.sizes.map((size, sizeIndex) => (
                        <div key={sizeIndex} className="flex gap-2">
                          <Input
                            placeholder="Size (e.g., M, L, XL)"
                            value={size.sizeName}
                            onChange={(e) => updateSize(colourIndex, sizeIndex, 'sizeName', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Stock"
                            value={size.stockQuantity}
                            onChange={(e) =>
                              updateSize(colourIndex, sizeIndex, 'stockQuantity', parseInt(e.target.value) || 0)
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSize(colourIndex, sizeIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/products') : window.location.href = '/admin/products')>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
