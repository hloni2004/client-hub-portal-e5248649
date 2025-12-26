import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import apiClient from '@/lib/api';
import { Loader2, Search, ShoppingBag, User, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';

interface Customer {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleName: string;
  createdAt: string;
}

interface Order {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: any[];
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user || user.roleName !== 'ADMIN') {
      navigate('/');
      return;
    }
    loadCustomers();
  }, [user]);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users/getAll');
      const usersData = response.data?.data || response.data || [];
      
      // Filter to show only CUSTOMER role users
      const customersOnly = usersData.filter((u: Customer) => u.roleName === 'CUSTOMER');
      setCustomers(customersOnly);
      setFilteredCustomers(customersOnly);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = customers.filter(
      (customer) =>
        customer.firstName?.toLowerCase().includes(term) ||
        customer.lastName?.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.username?.toLowerCase().includes(term) ||
        customer.phoneNumber?.includes(term)
    );
    setFilteredCustomers(filtered);
  };

  const loadCustomerOrders = async (customerId: number) => {
    setLoadingOrders(true);
    try {
      const response = await apiClient.get(`/orders/user/${customerId}`);
      let ordersData = response.data?.data || response.data || [];
      
      if (!Array.isArray(ordersData)) {
        ordersData = ordersData ? [ordersData] : [];
      }
      
      setCustomerOrders(ordersData);
    } catch (error) {
      console.error('Error loading customer orders:', error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadCustomerOrders(customer.userId);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalSpent = (orders: Order[]) => {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => (typeof navigate !== 'undefined' ? navigate('/admin/dashboard') : window.location.href = '/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">View customer profiles and purchase history</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, username, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="border rounded-lg">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
            </p>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Customers ({filteredCustomers.length})</h2>
            </div>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.userId}>
                      <TableCell className="font-medium">
                        {customer.firstName} {customer.lastName}
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phoneNumber || 'N/A'}</TableCell>
                      <TableCell>{customer.username}</TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Customer Profile</DialogTitle>
                              <DialogDescription>
                                View customer information and purchase history
                              </DialogDescription>
                            </DialogHeader>

                            {selectedCustomer && selectedCustomer.userId === customer.userId && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Customer Information</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-semibold">
                                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{selectedCustomer.email}</span>
                                    </div>
                                    {selectedCustomer.phoneNumber && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedCustomer.phoneNumber}</span>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      <p className="text-sm text-muted-foreground">
                                        Username: <span className="font-medium">{selectedCustomer.username}</span>
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Member since: <span className="font-medium">{formatDate(selectedCustomer.createdAt)}</span>
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Purchase History */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                      <span>Purchase History</span>
                                      {customerOrders.length > 0 && (
                                        <Badge variant="secondary">
                                          Total Spent: R{getTotalSpent(customerOrders).toFixed(2)}
                                        </Badge>
                                      )}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {loadingOrders ? (
                                      <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                      </div>
                                    ) : customerOrders.length === 0 ? (
                                      <div className="text-center py-8">
                                        <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">No orders yet</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        {customerOrders.map((order) => (
                                          <div
                                            key={order.orderId}
                                            className="border rounded-lg p-4 space-y-2"
                                          >
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <p className="font-semibold">Order #{order.orderNumber}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {formatDate(order.orderDate)}
                                                </p>
                                              </div>
                                              <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                              </Badge>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">
                                                {order.items?.length || 0} item(s)
                                              </span>
                                              <span className="font-semibold">
                                                R{order.totalAmount.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
