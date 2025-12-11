import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { Header } from '@/components/ecommerce/Header';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const shippingCost = subtotal >= 500 ? 0 : 25;
  const total = subtotal + shippingCost;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-32 pb-20">
        <div className="container-luxury">
          <h1 className="font-display text-4xl md:text-5xl text-center mb-4">Shopping Bag</h1>
          <p className="text-muted-foreground text-center mb-12">
            {items.length === 0 ? 'Your bag is empty' : `${items.length} item${items.length > 1 ? 's' : ''} in your bag`}
          </p>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-8">Discover our collection and find something you'll love.</p>
              <Link to="/shop">
                <Button className="text-sm tracking-[0.15em] uppercase px-12">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex gap-6 pb-6 border-b border-border">
                    <Link to={`/product/${item.productId}`} className="w-32 aspect-[3/4] flex-shrink-0 overflow-hidden bg-muted">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground tracking-wider uppercase mb-1">{item.product.brand}</p>
                          <h3 className="font-display text-xl">
                            <Link to={`/product/${item.productId}`} className="hover:text-primary transition-colors">
                              {item.product.name}
                            </Link>
                          </h3>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">Color: Noir • Size: M</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline">
                    Continue Shopping
                  </Link>
                  <button
                    onClick={clearCart}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    Clear Bag
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-32 lg:self-start">
                <div className="bg-muted/30 p-8 space-y-6">
                  <h2 className="font-display text-2xl">Order Summary</h2>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)}</span>
                    </div>
                    {subtotal < 500 && (
                      <p className="text-xs text-muted-foreground">
                        Add {formatPrice(500 - subtotal)} more for free shipping
                      </p>
                    )}
                    <div className="border-t border-border pt-4 flex justify-between text-lg">
                      <span>Total</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Link to="/checkout">
                    <Button className="w-full h-14 text-sm tracking-[0.15em] uppercase">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="text-center space-y-2 text-xs text-muted-foreground">
                    <p>Secure checkout powered by Stripe</p>
                    <p>Free returns within 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
