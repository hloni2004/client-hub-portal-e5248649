import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import apiClient from '@/lib/api';
import { Loader2, Package, ShoppingBag } from 'lucide-react';
import { Header } from '@/components/ecommerce/Header';

interface OrderItem {
  orderItemId: number;
  product: {
    productId: number;
    name: string;
    primaryImage?: { imageData: string };
  };
  colour: {
    colourId: number;
    name: string;
  };
  colourSize: {
    colourSizeId: number;
    sizeName: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  items: OrderItem[];
  shippingMethod: {
    name: string;
    estimatedDays: number;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/orders/user/${user?.userId}`);
      // Handle both wrapped and unwrapped response formats
      const ordersData = response.data.data || response.data;
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProductImageUrl = (imageData?: string) => {
    if (!imageData) return '/images/placeholder.png';
    // Backend now sends full data URL with prefix
    if (imageData.startsWith('data:')) return imageData;
    return `data:image/jpeg;base64,${imageData}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container-luxury">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
                <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
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
          <h1 className="font-display text-4xl md:text-5xl text-center mb-4">My Orders</h1>
          <p className="text-muted-foreground text-center mb-12">View and track your order history</p>

          <div className="space-y-6">
            {orders.map((order) => (
          <Card key={order.orderId}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription>Placed on {formatDate(order.orderDate)}</CardDescription>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.orderItemId} className="flex gap-4">
                    <img
                      src={getProductImageUrl(item.product.primaryImage?.imageData)}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.colour.name} / {item.colourSize.sizeName}
                      </p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">R{item.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">R{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Shipping Details
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.phone}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                    </p>
                    <p className="pt-2 font-medium">
                      {order.shippingMethod.name} ({order.shippingMethod.estimatedDays} days)
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Order Total</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>R{order.shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (15% VAT)</span>
                      <span>R{order.taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-base">
                      <span>Total</span>
                      <span>R{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
