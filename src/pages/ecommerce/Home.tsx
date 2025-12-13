import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { useCartStore } from '@/stores/ecommerce/cartStore';

export default function Home() {
  const { featuredProducts, categories, fetchProducts, fetchCategories } = useProductStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container-luxury flex items-center justify-between h-20">
          <Link to="/" className="font-display text-2xl tracking-widest">
            MAISON LUXE
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            {categories.slice(0, 4).map(cat => (
              <Link key={cat.id} to={`/shop?category=${cat.id}`} className="text-sm tracking-wider uppercase link-underline">
                {cat.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <Link to="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

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
            {categories.slice(0, 4).map((category, index) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.id}`}
                className="group relative aspect-[3/4] overflow-hidden bg-muted animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/40 transition-all duration-500" />
                <div className="absolute inset-0 flex items-end p-6">
                  <div>
                    <h3 className="font-display text-xl md:text-2xl text-white mb-1">{category.name}</h3>
                    <p className="text-white/70 text-sm">{category.productCount} items</p>
                  </div>
                </div>
              </Link>
            ))}
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
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted mb-6">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-image w-full h-full object-cover"
                    />
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
                        onClick={(e) => { e.preventDefault(); addItem(product, 1); }}
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
                    {product.salePrice ? (
                      <div className="flex items-center justify-center gap-3">
                        <span className="price-sale text-sm">{formatPrice(product.basePrice)}</span>
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
                Curating the finest luxury fashion since 1987. Where timeless elegance meets contemporary design.
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
