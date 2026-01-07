import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { Header } from '@/components/ecommerce/Header';
import apiClient from '@/lib/api';

export default function Home() {
  const { featuredProducts, categories, fetchProducts, fetchCategories } = useProductStore();
  const { addItem } = useCartStore();
  const [categoryProducts, setCategoryProducts] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch products for each category when categories are loaded
    if (categories.length > 0) {
      console.log('Categories loaded:', categories);
      fetchCategoryProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const fetchCategoryProducts = async () => {
    const productsMap: Record<number, any[]> = {};
    
    for (const category of categories.slice(0, 4)) {
      try {
        const response = await apiClient.get(`/products/category/${category.id}`);
        const products = response.data?.data || response.data || [];
        console.log(`Products for category ${category.name}:`, products);
        
        // Get active products from the category
        const activeProducts = Array.isArray(products) 
          ? products.filter((p: any) => p.isActive === true) 
          : [];
        
        // Store the first active product for this category
        if (activeProducts.length > 0) {
          productsMap[category.id] = activeProducts.slice(0, 1);
        } else {
          productsMap[category.id] = [];
        }
      } catch (error) {
        console.error(`Error fetching products for category ${category.id}:`, error);
        productsMap[category.id] = [];
      }
    }
    
    console.log('Category products map:', productsMap);
    setCategoryProducts(productsMap);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Get second image for hover effect
  const getSecondImageUrl = (product: any) => {
    if (product.productImages && product.productImages.length > 1) {
      return product.productImages[1].supabaseUrl || product.productImages[1].imageUrl || '';
    }
    if (product.images && product.images.length > 1) {
      return product.images[1];
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920')] bg-cover bg-center opacity-30" />
        <div className="relative text-center px-6 max-w-4xl mx-auto">
          <p className="text-sm tracking-[0.3em] uppercase mb-6 text-primary animate-fade-in">New Collection 2025</p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Timeless Elegance
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Discover our curated collection of luxury fashion pieces, crafted by the world's finest artisans.
          </p>
          <Link to="/shop">
            <Button variant="outline" size="lg" className="border-white text-white bg-white/10 hover:bg-white hover:text-foreground px-12 py-6 text-sm tracking-[0.2em] uppercase animate-fade-in" style={{ animationDelay: '0.6s' }}>
              Explore Collection
              <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="section-luxury bg-background">
        <div className="container-luxury">
          <div className="text-center mb-16">
            <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4">Curated Selection</p>
            <h2 className="font-display text-4xl md:text-5xl">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {categories.length === 0 ? (
              // Loading placeholder
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative aspect-[3/4] overflow-hidden bg-muted rounded-lg animate-pulse" />
                ))}
              </>
            ) : (
              categories.slice(0, 4).map((category, index) => {
                const product = categoryProducts[category.id]?.[0];
                
                // Use the image provided by the category (no fallback images)
                // If a category has no image, we render a neutral placeholder (no external default image)
                let imageUrl = category.image || '';
                if (imageUrl) {
                  console.log(`Using category image from database for ${category.name}:`, imageUrl.substring(0, 50) + '...');
                } else {
                  console.log(`No category image set for ${category.name}`);
                }

                return (
                  <Link
                    key={category.id}
                    to={`/shop?category=${category.id}`}
                    className="group relative aspect-[3/4] overflow-hidden bg-gray-200 animate-fade-in rounded-lg shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="eager"
                        key={`${category.id}-${imageUrl}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          console.error(`Image failed to load for ${category.name}`);
                          // Hide the broken image rather than using a fallback
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-muted-foreground">{category.name}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-500" />
                    <div className="absolute inset-0 flex items-end p-6">
                      <div className="text-left">
                        <h3 className="font-display text-xl md:text-2xl text-white mb-1 font-semibold">{category.name}</h3>
                        <p className="text-white/90 text-sm font-medium">
                          Explore collection
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-luxury bg-muted/30">
        <div className="container-luxury">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-sm tracking-[0.3em] uppercase text-primary mb-4">Handpicked</p>
              <h2 className="font-display text-4xl md:text-5xl">Featured Collection</h2>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-2 text-sm tracking-wider uppercase link-underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {featuredProducts.slice(0, 6).map((product, index) => (
              <div
                key={product.id}
                className="product-card group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link to={`/product/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-6 group">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-image product-image-front w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
                    />
                    {getSecondImageUrl(product) && (
                      <img
                        src={getSecondImageUrl(product)}
                        alt={`${product.name} alternate view`}
                        className="product-image product-image-back absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-[1500ms] ease-in-out"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="image-overlay" />
                    {product.isNew && (
                      <span className="absolute top-4 left-4 px-3 py-1 bg-success text-success-foreground text-xs tracking-wider uppercase">
                        New
                      </span>
                    )}
                    {product.salePrice && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-sale text-sale-foreground text-xs tracking-wider uppercase">
                        Sale
                      </span>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 text-reveal">
                      <Button
                        onClick={async (e) => { 
                          e.preventDefault(); 
                          const result = await addItem(product, 1);
                          if (!result.success && result.message) {
                            console.error(result.message);
                          }
                        }}
                        className="w-full bg-foreground text-background hover:bg-primary text-xs tracking-[0.15em] uppercase"
                      >
                        Add to Bag
                      </Button>
                    </div>
                  </div>
                </Link>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground tracking-wider uppercase mb-2">{product.brand}</p>
                  <h3 className="font-display text-xl mb-2">
                    <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
                      {product.name}
                    </Link>
                  </h3>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted'}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">({product.reviewCount})</span>
                  </div>
                  <div className="price-luxury">
                    {product.comparePrice && product.comparePrice > product.basePrice ? (
                      <div className="flex items-center justify-center gap-3">
                        <span className="price-sale text-sm">{formatPrice(product.comparePrice)}</span>
                        <span className="text-sale font-medium">{formatPrice(product.basePrice)}</span>
                      </div>
                    ) : (
                      <span>{formatPrice(product.basePrice)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-luxury gradient-dark text-white">
        <div className="container-luxury max-w-2xl text-center">
          <p className="text-sm tracking-[0.3em] uppercase text-primary mb-6">Exclusive Access</p>
          <h2 className="font-display text-4xl md:text-5xl mb-6">Join Our World</h2>
          <p className="text-white/60 mb-10">Subscribe for early access to new collections, private sales, and exclusive events.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-white/10 border border-white/20 px-6 py-4 text-sm placeholder:text-white/40 focus:outline-none focus:border-primary"
            />
            <Button className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs tracking-[0.15em] uppercase">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-foreground text-background">
        <div className="container-luxury">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="font-display text-2xl tracking-widest mb-6">MAISON LUXE</h3>
              <p className="text-background/60 text-sm leading-relaxed">
                Curating the finest luxury fashion since 2025. Where timeless elegance meets contemporary design.
              </p>
            </div>
            <div>
              <h4 className="text-sm tracking-wider uppercase mb-6">Shop</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                {categories.map(cat => (
                  <li key={cat.id}><Link to={`/shop?category=${cat.id}`} className="hover:text-primary transition-colors">{cat.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm tracking-wider uppercase mb-6">Support</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link to="/shipping" className="hover:text-primary transition-colors">Shipping</Link></li>
                <li><Link to="/returns" className="hover:text-primary transition-colors">Returns</Link></li>
                <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm tracking-wider uppercase mb-6">Follow</h4>
              <ul className="space-y-3 text-background/60 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pinterest</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-background/40 text-xs tracking-wider">
            © 2025 Maison Luxe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
