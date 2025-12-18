import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Star, Minus, Plus, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { Header } from '@/components/ecommerce/Header';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { ProductReviewDialog } from '@/components/ecommerce/ProductReviewDialog';
import { ProductReviews } from '@/components/ecommerce/ProductReviews';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { currentProduct, fetchProductById, featuredProducts, loading } = useProductStore();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewsKey, setReviewsKey] = useState(0);
  const [activeTab, setActiveTab] = useState('details');

  // Check if URL has #reviews hash and switch to reviews tab
  useEffect(() => {
    if (location.hash === '#reviews') {
      setActiveTab('reviews');
      // Scroll to tabs section after a short delay
      setTimeout(() => {
        const tabsElement = document.getElementById('product-tabs');
        if (tabsElement) {
          tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  // Set default color when product loads
  useEffect(() => {
    if (currentProduct?.colours && currentProduct.colours.length > 0 && !selectedColor) {
      setSelectedColor(currentProduct.colours[0]);
    }
  }, [currentProduct]);

  // Get available sizes for selected color
  const availableSizes = selectedColor?.sizes || [];

  useEffect(() => {
    if (id) {
      fetchProductById(parseInt(id));
      checkReviewEligibility();
    }
  }, [id, user]);

  const checkReviewEligibility = async () => {
    if (!user || !id) {
      setCanReview(false);
      return;
    }

    try {
      const response = await apiClient.get(`/reviews/can-review/${user.userId}/${id}`);
      console.log('Review eligibility response:', response.data);
      setCanReview(response.data?.canReview || false);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    }
  };

  const handleReviewSubmitted = () => {
    setReviewsKey(prev => prev + 1);
    checkReviewEligibility();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!currentProduct?.colours || currentProduct.colours.length === 0) {
      toast({ title: 'Product has no color options', variant: 'destructive' });
      return;
    }
    
    if (!selectedColor) {
      toast({ title: 'Please select a color', variant: 'destructive' });
      return;
    }
    
    if (!selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' });
      return;
    }
    
    // Check available stock
    const availableStock = selectedSize.stockQuantity - (selectedSize.reservedQuantity || 0);
    if (quantity > availableStock) {
      toast({ 
        title: 'Insufficient stock', 
        description: `Only ${availableStock} items available in stock.`,
        variant: 'destructive'
      });
      return;
    }
    
    if (currentProduct) {
      // Add item with proper IDs from database
      const result = await addItem(currentProduct, quantity, selectedColor.colourId, selectedSize.sizeId);
      if (result.success) {
        toast({ 
          title: 'Added to bag', 
          description: `${currentProduct.name} (${selectedColor.name}, ${selectedSize.sizeName}) has been added to your bag.` 
        });
      } else {
        toast({ 
          title: 'Unable to add to cart', 
          description: result.message || 'Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Helper to get product image URLs
  const getProductImageUrls = () => {
    if (!currentProduct) return [];

    // Use supabaseUrl or imageUrl from productImages if available
    if (currentProduct.productImages && currentProduct.productImages.length > 0) {
      // Sort by display order and primary first
      const sortedImages = [...currentProduct.productImages].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      return sortedImages.map(img => img.supabaseUrl || img.imageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800');
    }

    // Fallback to legacy images array
    if (currentProduct.images && currentProduct.images.length > 0) {
      return currentProduct.images;
    }

    // Default fallback image
    return ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'];
  };

  if (loading || !currentProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 container-luxury">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-muted animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 bg-muted w-1/3 animate-pulse" />
              <div className="h-12 bg-muted w-2/3 animate-pulse" />
              <div className="h-6 bg-muted w-1/4 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = getProductImageUrls();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />

      {/* Breadcrumb */}
      <div className="pt-28 pb-6 border-b border-border">
        <div className="container-luxury">
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{currentProduct.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-luxury py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No images available
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 aspect-[3/4] overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      currentImageIndex === index ? 'border-foreground' : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${currentProduct.name} - View ${index + 1}`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-32 lg:self-start space-y-8">
            <div>
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-2">{currentProduct.brand}</p>
              <h1 className="font-display text-4xl md:text-5xl mb-4">{currentProduct.name}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(currentProduct.rating) ? 'fill-primary text-primary' : 'text-muted'}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {currentProduct.reviewCount} reviews
                </span>
              </div>
              <div className="price-luxury text-2xl">
                {currentProduct.salePrice ? (
                  <div className="flex items-center gap-4">
                    <span className="price-sale">{formatPrice(currentProduct.basePrice)}</span>
                    <span className="text-sale font-medium">{formatPrice(currentProduct.salePrice)}</span>
                  </div>
                ) : (
                  <span>{formatPrice(currentProduct.basePrice)}</span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{currentProduct.description}</p>

            {/* Color Selection */}
            {currentProduct.colours && currentProduct.colours.length > 0 && (
              <div>
                <p className="text-sm tracking-wider uppercase mb-4">
                  Color: <span className="text-muted-foreground">{selectedColor?.name || 'Select a color'}</span>
                </p>
                <div className="flex gap-3 flex-wrap">
                  {currentProduct.colours.map(color => (
                    <button
                      key={color.colourId}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedSize(null); // Reset size when color changes
                      }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor?.colourId === color.colourId ? 'border-foreground scale-110' : 'border-border'
                      }`}
                      style={{ backgroundColor: color.hexCode }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {selectedColor && availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm tracking-wider uppercase">Size</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size: any) => {
                    const isAvailable = size.stockQuantity > size.reservedQuantity;
                    return (
                      <button
                        key={size.sizeId}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`w-14 h-14 border text-sm tracking-wider transition-all ${
                          selectedSize?.sizeId === size.sizeId
                            ? 'border-foreground bg-foreground text-background'
                            : isAvailable
                            ? 'border-border hover:border-foreground'
                            : 'border-border/30 text-muted-foreground/30 cursor-not-allowed line-through'
                        }`}
                      >
                        {size.sizeName}
                      </button>
                    );
                  })}
                </div>
                {selectedColor && availableSizes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No sizes available for this color</p>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex gap-4">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-14 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const availableStock = selectedSize 
                      ? selectedSize.stockQuantity - (selectedSize.reservedQuantity || 0)
                      : 99;
                    setQuantity(q => Math.min(availableStock, q + 1));
                  }}
                  disabled={!selectedSize}
                  className="w-12 h-14 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="flex-1 h-14 text-sm tracking-[0.15em] uppercase"
              >
                Add to Bag
              </Button>
            </div>
            {selectedSize && (
              <p className="text-sm text-muted-foreground">
                {selectedSize.stockQuantity - (selectedSize.reservedQuantity || 0)} items available in stock
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-6 pt-4 border-t border-border">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Heart className="h-4 w-4" /> Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div id="product-tabs" className="mt-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-sm tracking-wider uppercase">
                Details
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-sm tracking-wider uppercase">
                Reviews
              </TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-sm tracking-wider uppercase">
                Shipping
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="py-8">
              <div className="prose max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-6">{currentProduct.description}</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Crafted from the finest materials</li>
                  <li>• Handmade by skilled artisans</li>
                  <li>• Comes with authenticity certificate</li>
                  <li>• Complimentary luxury gift packaging</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="py-8">
              <div className="space-y-6">
                <div className="pb-6 border-b">
                  <ProductReviewDialog
                    productId={parseInt(id!)}
                    productName={currentProduct?.name || ''}
                    canReview={canReview}
                    onReviewSubmitted={handleReviewSubmitted}
                  />
                </div>
                <ProductReviews key={reviewsKey} productId={parseInt(id!)} />
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="py-8">
              <div className="space-y-4 text-muted-foreground">
                <p>We offer complimentary shipping on all orders over R500.</p>
                <p><strong className="text-foreground">Standard Delivery:</strong> 5-7 business days (Complimentary)</p>
                <p><strong className="text-foreground">Express Delivery:</strong> 2-3 business days (+R25)</p>
                <p><strong className="text-foreground">Same Day Delivery:</strong> Available in select cities (+R50)</p>
                <p className="mt-6">All items are shipped in our signature luxury packaging with complimentary gift wrapping.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-20">
          <h2 className="font-display text-3xl text-center mb-12">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.filter(p => p.id !== currentProduct.id).slice(0, 4).map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="product-card group">
                <div className="aspect-[3/4] overflow-hidden bg-muted mb-4">
                  <img src={product.images[0]} alt={product.name} className="product-image w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">{product.brand}</p>
                <h3 className="font-display text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-sm">{formatPrice(product.salePrice || product.basePrice)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
