import { useEffect, useState } from 'react';
import { ArrowUpDown, ChevronDown, Loader2, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface OrderItem {
  itemId: number;
  product: {
    productId: number;
    name: string;
    primaryImage?: {
      imageUrl: string;
    };
  };
  colour: {
    name: string;
  };
  colourSize: {
    sizeName: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  orderId: number;
  orderNumber: string;
  user: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  orderDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  shippingMethod: {
    name: string;
  };
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/orders/getAll');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load orders',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  const handleStatusChange = (order: Order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
    setIsStatusDialogOpen(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !selectedStatus) return;

    try {
      setUpdatingOrderId(selectedOrder.orderId);
      const response = await apiClient.put(`/orders/${selectedOrder.orderId}/status`, {
        status: selectedStatus,
      });

      if (response.data.success) {
        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderId === selectedOrder.orderId
              ? { ...order, status: selectedStatus as Order['status'] }
              : order
          )
        );

        toast({
          title: 'Success',
          description: `Order ${selectedOrder.orderNumber} status updated to ${selectedStatus}. Customer notification email sent.`,
        });

        setIsStatusDialogOpen(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.data.message || 'Failed to update order status',
        });
      }
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update order status',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'ALL') return true;
    return order.status === filterStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'date') {
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    } else {
      return b.totalAmount - a.totalAmount;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Orders</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Order Date (Newest)</SelectItem>
                    <SelectItem value="amount">Order Amount (Highest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Orders ({sortedOrders.length})
            </CardTitle>
            <CardDescription>
              {filterStatus === 'ALL' ? 'All orders' : `Orders with status: ${filterStatus}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Order Number</th>
                      <th className="text-left py-3 px-4 font-semibold">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-right py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-center py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr key={order.orderId} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">{order.orderNumber}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">
                              {order.user.firstName} {order.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{order.user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          R{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={STATUS_COLORS[order.status]}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStatusChange(order)}
                            >
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Update Status
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Order placed on{' '}
              {selectedOrder && new Date(selectedOrder.orderDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOrder.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <h3 className="font-semibold mb-2">Order Status</h3>
                <Badge className={`${STATUS_COLORS[selectedOrder.status]} text-lg py-2 px-3`}>
                  {selectedOrder.status}
                </Badge>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded text-sm">
                  <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && (
                    <p>{selectedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.province}{' '}
                    {selectedOrder.shippingAddress.postalCode}
                  </p>
                  <p>{selectedOrder.shippingAddress.country}</p>
                  <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.itemId} className="flex gap-4 bg-gray-50 p-4 rounded border">
                      {item.product.primaryImage ? (
                        <img
                          src={item.product.primaryImage.imageUrl}
                          alt={item.product.name}
                          className="w-32 h-32 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-300 rounded flex items-center justify-center flex-shrink-0">
                          <p className="text-gray-500 text-sm">No Image</p>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.product.name}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Colour: {item.colour.name} | Size: {item.colourSize.sizeName}
                        </p>
                        <div className="bg-white p-3 rounded border border-gray-200 mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Quantity:</span> {item.quantity}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Price per item:</span> R{item.price.toFixed(2)}
                          </p>
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            Subtotal: R{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping ({selectedOrder.shippingMethod.name}):</span>
                    <span>R{selectedOrder.shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (15% VAT):</span>
                    <span>R{selectedOrder.taxAmount.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-R{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order {selectedOrder?.orderNumber}. Customer will be notified
              via email.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Current Status: {selectedOrder.status}</p>
                <p className="text-sm text-gray-600 mb-4">Select new status:</p>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={updatingOrderId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={updateOrderStatus}
              disabled={updatingOrderId !== null || !selectedStatus}
            >
              {updatingOrderId === selectedOrder?.orderId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
