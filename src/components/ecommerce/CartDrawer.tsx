import { Link } from 'react-router-dom';
import { X, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/stores/ecommerce/cartStore';

export function CartDrawer() {
  const { items, subtotal, itemCount, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-2xl">Your Bag ({itemCount})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-6" />
            <p className="text-muted-foreground mb-6">Your bag is empty</p>
            <Link to="/shop" onClick={closeCart}>
              <Button variant="outline" className="text-sm tracking-[0.15em] uppercase">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <Link to={`/product/${item.productId}`} onClick={closeCart} className="w-24 h-32 flex-shrink-0 overflow-hidden bg-muted rounded">
                    <img 
                      src={
                        item.product.productImages?.[0]?.imageId 
                          ? `http://localhost:8080/api/products/image/${item.product.productImages[0].imageId}`
                          : item.product.images?.[0] || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'
                      } 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';
                      }}
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-1">
                      <h4 className="font-display text-sm truncate">
                        <Link to={`/product/${item.productId}`} onClick={closeCart} className="hover:text-primary transition-colors">
                          {item.product.name}
                        </Link>
                      </h4>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Noir • M</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
              
              <div className="space-y-3">
                <Link to="/checkout" onClick={closeCart}>
                  <Button className="w-full h-12 text-xs tracking-[0.15em] uppercase">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
