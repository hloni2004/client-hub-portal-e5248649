import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, MapPin, Package, Truck } from 'lucide-react';
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
    primaryImage?: { imageData: string };
  };
  colour: {
    colourId: number;
    colour: string;
  };
  colourSize: {
    colourSizeId: number;
    size: string;
    price: number;
  };
  quantity: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(true);
  
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
      navigate('/login');
      return;
    }
    loadCheckoutData();
  }, [user]);

  const loadCheckoutData = async () => {
    setLoading(true);
    try {
      // Load shipping methods
      const methodsRes = await apiClient.get('/api/checkout/shipping-methods');
      setShippingMethods(methodsRes.data);
      if (methodsRes.data.length > 0) {
        setSelectedMethod(methodsRes.data[0].methodId.toString());
      }

      // Load cart items
      const cartRes = await apiClient.get(`/api/checkout/cart/${user?.userId}`);
      setCartItems(cartRes.data.items || []);

      // Load saved addresses
      const addressRes = await apiClient.get(`/api/checkout/addresses/user/${user?.userId}`);
      setSavedAddresses(addressRes.data);
      if (addressRes.data.length > 0) {
        setUseNewAddress(false);
        setSelectedAddressId(addressRes.data[0].addressId.toString());
      }
    } catch (error) {
      console.error('Failed to load checkout data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load checkout data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity * item.colourSize.price), 0);
  };

  const getShippingCost = () => {
    const method = shippingMethods.find(m => m.methodId.toString() === selectedMethod);
    return method?.cost || 0;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.15; // 15% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost() + calculateTax();
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
        const addressRes = await apiClient.post('/api/checkout/addresses', address);
        addressId = addressRes.data.addressId;
      }

      // Create order
      const orderRes = await apiClient.post('/api/checkout/create-order', {
        userId: user?.userId,
        shippingMethodId: parseInt(selectedMethod),
        shippingAddressId: parseInt(addressId),
      });

      toast({
        title: 'Success',
        description: `Order ${orderRes.data.orderNumber} placed successfully!`,
      });

      // Navigate to order confirmation or orders page
      navigate('/orders');
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getProductImageUrl = (imageData?: string) => {
    if (!imageData) return '/images/placeholder.png';
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
                <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
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
          <h1 className="font-display text-4xl md:text-5xl text-center mb-12">Checkout</h1>

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address
              </CardTitle>
              <CardDescription>Where should we deliver your order?</CardDescription>
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
                        {item.colour.colour} / {item.colourSize.size}
                      </p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      R{(item.quantity * item.colourSize.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R{calculateSubtotal().toFixed(2)}</span>
                </div>
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
