import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { useProductStore } from '@/stores/ecommerce/productStore';

export function Header() {
  const { itemCount, openCart } = useCartStore();
  const { categories } = useProductStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-luxury flex items-center justify-between h-20">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <nav className="flex flex-col gap-6 mt-12">
              <Link to="/shop" className="font-display text-2xl">Shop All</Link>
              {categories.map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.id}`} className="text-lg text-muted-foreground hover:text-foreground transition-colors">
                  {cat.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="font-display text-xl md:text-2xl tracking-[0.2em]">
          MAISON LUXE
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
          <Link to="/shop" className="text-sm tracking-wider uppercase link-underline">
            Shop
          </Link>
          {categories.slice(0, 4).map(cat => (
            <Link key={cat.id} to={`/shop?category=${cat.id}`} className="text-sm tracking-wider uppercase link-underline">
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
