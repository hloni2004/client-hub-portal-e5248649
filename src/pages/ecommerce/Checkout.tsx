import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/ecommerce/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { Loader2, MapPin, Package, Truck, Tag, X } from 'lucide-react';
import { Header } from '@/components/ecommerce/Header';

interface ShippingMethod {
  methodId: number;
  name: string;
  description: string;
  cost: number;
  estimatedDays: number;
  isActive: boolean;
}

interface Address {
  addressId?: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
  user: { userId: number };
}

interface CartItem {
  cartItemId: number;
  product: {
    productId: number;
    name: string;
    basePrice: number;
    primaryImage?: { imageData: string };
  };
  colour: {
    colourId: number;
    name: string;
  };
  size: {
    sizeId: number;
    sizeName: string;
  };
  quantity: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { clearCart } = useCartStore();
  const location = useLocation();

  // IMPORTANT: For security and correctness, Checkout ignores any cart passed via route state or local persisted storage.
  // The server cart is the single source of truth and will be fetched after synchronization.
  // We'll still hold a local state for rendering server response only after successful fetch.

  // no passedCart, no direct use of persisted state here
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  
  const [address, setAddress] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    addressType: 'SHIPPING',
    isDefault: false,
    user: { userId: user?.userId || 0 }
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    let cancelled = false;

    const doLoad = async () => {
      await loadCheckoutData();
    };

    doLoad();

    // Refresh data on window focus to avoid showing stale data if user switched tabs
    const onFocus = () => {
      console.log('Window focused - refreshing checkout data');
      doLoad();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
  }, [user]);

  const loadCheckoutData = async () => {
    setLoading(true);

    // Strict single source of truth: ignore any passed or persisted cart data on Checkout mount.
    // 1) Synchronize local items to the server (so server has all local items)
    try {
      const syncRes = await useCartStore.getState().syncLocalToServer();
      if (!syncRes.success) {
        console.warn('Sync local cart to server returned:', syncRes);
        toast({
          title: 'Cart sync failed',
          description: syncRes.message || 'Failed to synchronize your local cart with your account. Please try again or re-login.',
          variant: 'destructive',
        });
        // Redirect to cart so the user can review and try again
        navigate('/cart');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Error syncing local cart before checkout', e);
      toast({
        title: 'Cart sync error',
        description: 'An unexpected error occurred while synchronizing your cart. Please try again.',
        variant: 'destructive',
      });
      navigate('/cart');
      setLoading(false);
      return;
    }

    // 2) Fetch authoritative server cart and replace local store entirely (do not merge)
    try {
      const cartRes = await apiClient.get(`/checkout/cart/${user?.userId}`);
      const serverCart = cartRes.data || {};
      const items = serverCart.items || [];

      const mapped = items.map((si: any) => ({
        cartItemId: si.cartItemId,
        product: {
          productId: si.product?.productId,
          name: si.product?.name,
          basePrice: si.product?.basePrice,
          primaryImage: si.product?.primaryImage ? { imageData: si.product.primaryImage.imageData } : undefined,
        },
        colour: {
          colourId: si.colour?.colourId,
          name: si.colour?.name || 'N/A',
        },
        size: {
          sizeId: si.size?.sizeId,
          sizeName: si.size?.sizeName || 'N/A',
        },
        quantity: si.quantity,
      } as CartItem));

      // If server cart is empty, redirect to cart page
      if (mapped.length === 0) {
        toast({
          title: 'Cart is empty',
          description: 'Add some items to your cart before checking out',
        });
        setLoading(false);
        navigate('/cart');
        return;
      }

      // Replace local store with server response
      useCartStore.setState({ items: mapped, subtotal: mapped.reduce((s, it) => s + (it.product.basePrice * it.quantity), 0), itemCount: mapped.reduce((s, it) => s + it.quantity, 0) });

      // Set checkout UI state only after authoritative server cart is retrieved
      setCartItems(mapped);
    } catch (e: any) {
      console.error('Error fetching server cart for checkout:', e);
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to load checkout cart', variant: 'destructive' });
      navigate('/cart');
      setLoading(false);
      return;
    }



      // Load shipping methods
      const methodsRes = await apiClient.get('/checkout/shipping-methods');
      console.log('Shipping methods response:', methodsRes.data);
      setShippingMethods(methodsRes.data || []);
      if (methodsRes.data && methodsRes.data.length > 0 && methodsRes.data[0].methodId) {
        setSelectedMethod(methodsRes.data[0].methodId.toString());
      }

      // Load cart items
      try {


      // Load saved addresses
      const addressRes = await apiClient.get(`/checkout/addresses/user/${user?.userId}`);
      setSavedAddresses(addressRes.data || []);
      if (addressRes.data && addressRes.data.length > 0 && addressRes.data[0].addressId) {
        setUseNewAddress(false);
        setSelectedAddressId(addressRes.data[0].addressId.toString());
      }
    } catch (error: any) {
      console.error('Failed to load checkout data:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to load checkout data',
        variant: 'destructive',
      });
      // Redirect to cart if there's an error
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.product.basePrice), 0);
  };

  const getShippingCost = () => {
    const method = shippingMethods.find(m => m.methodId.toString() === selectedMethod);
    return method?.cost || 0;
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = calculateSubtotal() - promoDiscount;
    return subtotalAfterDiscount * 0.15; // 15% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() - promoDiscount + getShippingCost() + calculateTax();
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoMessage('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    setPromoMessage('');

    try {
      // Prepare product quantities map
      const productQuantities: { [key: number]: number } = {};
      cartItems.forEach(item => {
        productQuantities[item.product.productId] = item.quantity;
      });

      const response = await apiClient.post('/promos/apply', {
        code: promoCode.toUpperCase(),
        userId: user?.userId,
        productQuantities,
        cartSubtotal: calculateSubtotal(),
      });

      if (response.data.applied) {
        setAppliedPromo(response.data);
        setPromoDiscount(response.data.discountAmount);
        setPromoMessage(response.data.message);
        toast({
          title: 'Promo Applied!',
          description: response.data.message,
        });
      } else {
        setPromoMessage(response.data.message);
        setAppliedPromo(null);
        setPromoDiscount(0);
      }
    } catch (error: any) {
      console.error('Error applying promo:', error);
      setPromoMessage(error.response?.data?.message || 'Invalid promo code');
      setAppliedPromo(null);
      setPromoDiscount(0);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setPromoDiscount(0);
    setPromoMessage('');
  };

  const handlePlaceOrder = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Error',
        description: 'Please select a shipping method',
        variant: 'destructive',
      });
      return;
    }

    if (useNewAddress) {
      if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.province || !address.postalCode) {
        toast({
          title: 'Error',
          description: 'Please fill in all required address fields',
          variant: 'destructive',
        });
        return;
      }
    } else if (!selectedAddressId) {
      toast({
        title: 'Error',
        description: 'Please select a delivery address',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      let addressId = selectedAddressId;

      // If using new address, create it first
      if (useNewAddress) {
        const addressRes = await apiClient.post('/checkout/addresses', address);
        addressId = addressRes.data.addressId;
      }

      // Re-fetch server cart and verify it matches the UI cart before placing order
      try {
        const latestCartRes = await apiClient.get(`/checkout/cart/${user?.userId}`);
        const latestItems = latestCartRes.data.items || [];

        // Basic sanity checks - if server cart differs from UI cart, refresh and ask user to retry
        if (latestItems.length !== cartItems.length) {
          toast({
            title: 'Cart changed',
            description: 'Your cart changed on the server. Refreshing checkout with the latest cart. Please review and place your order again.',
            variant: 'destructive',
          });
          await loadCheckoutData();
          setSubmitting(false);
          return;
        }

        // Compare subtotal to detect price/quantity changes
        const latestSubtotal = latestItems.reduce((s: number, it: any) => s + (it.quantity * it.product.basePrice), 0);
        if (Math.abs(latestSubtotal - calculateSubtotal()) > 0.5) {
          toast({
            title: 'Cart totals changed',
            description: 'Cart totals on the server do not match the totals shown. Refreshing checkout. Please review before placing your order.',
            variant: 'destructive',
          });
          await loadCheckoutData();
          setSubmitting(false);
          return;
        }
      } catch (e) {
        console.error('Failed to re-validate server cart before placing order:', e);
        toast({ title: 'Error', description: 'Could not validate cart before placing order. Try again.', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Create order
      const orderRes = await apiClient.post('/checkout/create-order', {
        userId: user?.userId,
        shippingMethodId: parseInt(selectedMethod),
        shippingAddressId: parseInt(addressId),
      });

      // Clear cart after successful order
      setCartItems([]);
      // Also clear from global cart store
      clearCart();
      try {
        await apiClient.post(`/cart/clear/${user?.userId}`);
      } catch (error) {
        console.error('Error clearing cart from backend:', error);
      }
      
      toast({
        title: '🎉 Order Placed Successfully!',
        description: `Order ${orderRes.data.orderNumber} has been placed. Check your email (${user?.email}) for confirmation and invoice.`,
        duration: 6000,
      });

      // Navigate to order confirmation or orders page
      setTimeout(() => { if (typeof navigate !== 'undefined') navigate('/orders'); else window.location.href = '/orders'; }, 2000);
    } catch (error: any) {
      console.error('Failed to place order:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to place order';
      const errorType = error.response?.data?.errorType || '';
      
      toast({
        title: 'Error',
        description: `${errorMessage}${errorType ? ` (${errorType})` : ''}`,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImageUrl = (imageData?: string) => {
    if (!imageData) return '/images/logo/logo.png';
    // Backend now sends full data URL with prefix
    if (imageData.startsWith('data:')) return imageData;
    return `data:image/jpeg;base64,${imageData}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container-luxury">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-gray-600 mb-4">Add some items to your cart before checking out</p>
                <Button onClick={() => (typeof navigate !== 'undefined' ? navigate('/shop') : window.location.href = '/shop')}>Continue Shopping</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-luxury">
          <h1 className="font-display text-4xl md:text-5xl text-center mb-4">Checkout</h1>
          <p className="text-muted-foreground text-center mb-12">Enter your shipping details to complete your order</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Shipping Method & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Method
              </CardTitle>
              <CardDescription>Choose how you want your order delivered</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {shippingMethods.map((method) => (
                  <div key={method.methodId} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={method.methodId.toString()} id={`method-${method.methodId}`} />
                    <Label htmlFor={`method-${method.methodId}`} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{method.name}</p>
                          <p className="text-sm text-gray-600">{method.description}</p>
                          <p className="text-sm text-gray-500">Estimated delivery: {method.estimatedDays} days</p>
                        </div>
                        <p className="font-semibold">R{method.cost.toFixed(2)}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="border-2">
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-6 w-6" />
                Shipping Details
              </CardTitle>
              <CardDescription>Enter where you want your order delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savedAddresses.length > 0 && (
                <>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={!useNewAddress ? 'default' : 'outline'}
                      onClick={() => setUseNewAddress(false)}
                      className="flex-1"
                    >
                      Saved Address
                    </Button>
                    <Button
                      type="button"
                      variant={useNewAddress ? 'default' : 'outline'}
                      onClick={() => setUseNewAddress(true)}
                      className="flex-1"
                    >
                      New Address
                    </Button>
                  </div>

                  {!useNewAddress && (
                    <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                      {savedAddresses.map((addr) => (
                        <div key={addr.addressId} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value={addr.addressId?.toString() || ''} id={`addr-${addr.addressId}`} className="mt-1" />
                          <Label htmlFor={`addr-${addr.addressId}`} className="flex-1 cursor-pointer">
                            <p className="font-semibold">{addr.fullName}</p>
                            <p className="text-sm text-gray-600">{addr.phone}</p>
                            <p className="text-sm text-gray-600">{addr.addressLine1}</p>
                            {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                            <p className="text-sm text-gray-600">
                              {addr.city}, {addr.province} {addr.postalCode}
                            </p>
                            {addr.isDefault && <span className="text-xs text-blue-600 font-medium">Default</span>}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </>
              )}

              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+27 12 345 6789"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      value={address.addressLine1}
                      onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      value={address.addressLine2}
                      onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="Johannesburg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      value={address.province}
                      onChange={(e) => setAddress({ ...address, province: e.target.value })}
                      placeholder="Gauteng"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      placeholder="South Africa"
                    />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={address.isDefault}
                      onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isDefault" className="cursor-pointer">Save as default address</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3">
                    <img
                      src={getProductImageUrl(item.product.primaryImage?.imageData)}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.colour.name} / {item.size.sizeName}
                      </p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      R{(item.quantity * item.product.basePrice).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Promo Code Section */}
              <div className="space-y-2">
                <Label htmlFor="promoCode" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Promo Code
                </Label>
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <Input
                      id="promoCode"
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={applyingPromo}
                    >
                      {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="font-mono font-bold text-green-600">{promoCode}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePromo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {promoMessage && (
                  <p className={`text-xs ${appliedPromo ? 'text-green-600' : 'text-red-600'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R{calculateSubtotal().toFixed(2)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo Discount</span>
                    <span>-R{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>R{getShippingCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (15% VAT)</span>
                  <span>R{calculateTax().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>R{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
