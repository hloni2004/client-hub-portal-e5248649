import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { useProductStore } from '@/stores/ecommerce/productStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SearchWithAutocomplete } from './SearchWithAutocomplete';
import { useState, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { itemCount, openCart } = useCartStore();
  const { categories, fetchCategories } = useProductStore();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/auth/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-luxury relative h-20">
        {/* Left: Desktop Nav + Mobile Menu */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center gap-6">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav className="flex flex-col gap-6 mt-12">
                {categories.map(cat => (
                  <Link key={cat.id} to={`/shop?category=${cat.id}`} className="text-lg text-muted-foreground hover:text-foreground transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {categories.slice(0, 4).map(cat => (
              <Link key={cat.id} to={`/shop?category=${cat.id}`} className="text-xs tracking-wider uppercase link-underline whitespace-nowrap">
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="font-display text-xl md:text-2xl tracking-[0.2em] whitespace-nowrap">
            MAISON LUXE
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-4">
          
          {/* Actions */}
          {/* Desktop Search */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Search Products</DialogTitle>
                <DialogDescription>Find products by name, category, or brand</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <SearchWithAutocomplete />
              </div>
            </DialogContent>
          </Dialog>

          {/* Mobile Search */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Search className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Search Products</DialogTitle>
                <DialogDescription>Find products by name, category, or brand</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <SearchWithAutocomplete />
              </div>
            </DialogContent>
          </Dialog>
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user?.roleName === 'ADMIN' && (
                <>
                  <DropdownMenuItem onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')} className="cursor-pointer">
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => (typeof navigate !== 'undefined' ? navigate('/profile') : window.location.href = '/profile')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (typeof navigate !== 'undefined' ? navigate('/orders') : window.location.href = '/orders')} className="cursor-pointer">
                <span>My Orders</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
