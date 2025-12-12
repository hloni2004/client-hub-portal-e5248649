import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, Star, SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { CartDrawer } from '@/components/ecommerce/CartDrawer';
import { Header } from '@/components/ecommerce/Header';

export default function Shop() {
  const [searchParams] = useSearchParams();
  const { products, categories, fetchProducts, fetchCategories, loading, searchProducts } = useProductStore();
  const { addItem, itemCount } = useCartStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');

  // Helper to get product image URL
  const getProductImageUrl = (product: any) => {
    // Check if product has blob-based images
    if (product.productImages && product.productImages.length > 0) {
      const primaryImage = product.productImages.find((img: any) => img.isPrimary) || product.productImages[0];
      return `http://localhost:8080/api/products/image/${primaryImage.imageId}`;
    }
    // Fallback to legacy images array
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return '';
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam);
      searchProducts(searchParam);
    } else {
      fetchProducts();
    }
    if (categoryParam) {
      setSelectedCategories([parseInt(categoryParam)]);
    }
  }, [categoryParam, searchParam]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter and sort products
  let filteredProducts = products.filter(product => {
    const price = product.salePrice || product.basePrice;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoryId);
    return matchesPrice && matchesSearch && matchesCategory;
  });

  // Sort
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return (a.salePrice || a.basePrice) - (b.salePrice || b.basePrice);
      case 'price-desc':
        return (b.salePrice || b.basePrice) - (a.salePrice || a.basePrice);
      case 'rating':
        return b.rating - a.rating;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Get unique categories by id to avoid duplicates
  const uniqueCategories = categories.filter((category, index, self) => 
    index === self.findIndex((c) => c.id === category.id)
  );

  const FilterSidebar = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-sm tracking-wider uppercase mb-4 font-medium">Categories</h3>
        <div className="space-y-3">
          {uniqueCategories.map(category => (
            <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
                className="border-muted-foreground/50"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                {category.name} ({category.productCount})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm tracking-wider uppercase mb-4 font-medium">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={15000}
          step={100}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full text-xs tracking-wider uppercase"
        onClick={() => {
          setSelectedCategories([]);
          setPriceRange([0, 15000]);
          setSearchQuery('');
        }}
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />

      {/* Page Header */}
      <div className="pt-32 pb-12 border-b border-border">
        <div className="container-luxury">
          <h1 className="font-display text-4xl md:text-5xl text-center mb-4">The Collection</h1>
          <p className="text-muted-foreground text-center max-w-xl mx-auto">
            Discover our curated selection of luxury fashion pieces, crafted with exceptional attention to detail.
          </p>
        </div>
      </div>

      <div className="container-luxury py-12">
        <div className="flex gap-12">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle className="font-display text-xl">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-8">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} products
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Best Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden md:flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-muted mb-4" />
                    <div className="h-4 bg-muted w-1/3 mb-2" />
                    <div className="h-5 bg-muted w-2/3 mb-2" />
                    <div className="h-4 bg-muted w-1/4" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground mb-4">No products found matching your criteria.</p>
                <Button variant="outline" onClick={() => {
                  setSelectedCategories([]);
                  setPriceRange([0, 15000]);
                  setSearchQuery('');
                }}>
                  Clear Filters
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="product-card group animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-4">
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="product-image w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
                          }}
                        />
                        <div className="image-overlay" />
                        {product.isNew && (
                          <span className="absolute top-3 left-3 px-2 py-1 bg-success text-success-foreground text-[10px] tracking-wider uppercase">
                            New
                          </span>
                        )}
                        {product.salePrice && (
                          <span className="absolute top-3 right-3 px-2 py-1 bg-sale text-sale-foreground text-[10px] tracking-wider uppercase">
                            Sale
                          </span>
                        )}
                        <div className="absolute bottom-3 left-3 right-3 text-reveal">
                          <Button
                            onClick={(e) => { e.preventDefault(); addItem(product, 1); }}
                            size="sm"
                            className="w-full bg-foreground text-background hover:bg-primary text-[10px] tracking-[0.15em] uppercase"
                          >
                            Add to Bag
                          </Button>
                        </div>
                      </div>
                    </Link>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">{product.brand}</p>
                      <h3 className="font-display text-lg mb-1">
                        <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <div className="flex items-center justify-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted'}`} />
                        ))}
                      </div>
                      <div className="price-luxury text-sm">
                        {product.salePrice ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="price-sale">{formatPrice(product.basePrice)}</span>
                            <span className="text-sale font-medium">{formatPrice(product.salePrice)}</span>
                          </div>
                        ) : (
                          <span>{formatPrice(product.basePrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex gap-6 p-4 border border-border rounded-sm hover:border-primary/50 transition-colors">
                    <Link to={`/product/${product.id}`} className="w-32 aspect-[3/4] flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
                        }}
                      />
                    </Link>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">{product.brand}</p>
                      <h3 className="font-display text-xl mb-2">
                        <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="price-luxury">
                          {product.salePrice ? (
                            <div className="flex items-center gap-2">
                              <span className="price-sale text-sm">{formatPrice(product.basePrice)}</span>
                              <span className="text-sale font-medium">{formatPrice(product.salePrice)}</span>
                            </div>
                          ) : (
                            <span>{formatPrice(product.basePrice)}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addItem(product, 1)}
                          className="text-[10px] tracking-[0.15em] uppercase"
                        >
                          Add to Bag
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
