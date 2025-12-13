import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Users, TrendingUp, FolderTree, LogOut, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [productsRes, usersRes, ordersRes] = await Promise.all([
        apiClient.get('/products/getAll'),
        apiClient.get('/users/getAll'),
        apiClient.get('/orders/getAll').catch((error) => {
          console.error('Failed to fetch orders:', error.response?.status, error.response?.data);
          return { data: { data: [] } };
        }),
      ]);
      
      // Calculate total orders and revenue
      const ordersData = ordersRes.data?.data || ordersRes.data || [];
      const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0;
      const totalRevenue = Array.isArray(ordersData) 
        ? ordersData.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
        : 0;
      
      setStats({
        totalProducts: productsRes.data.data?.length || productsRes.data.length || 0,
        totalOrders: totalOrders,
        totalUsers: usersRes.data.data?.length || usersRes.data.length || 0,
        revenue: totalRevenue,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      description: 'Products in inventory',
      action: () => navigate('/admin/products'),
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Registered users',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      description: 'All time orders',
    },
    {
      title: 'Revenue',
      value: `R${stats.revenue.toFixed(2)}`,
      icon: TrendingUp,
      description: 'Total revenue',
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your e-commerce store</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={stat.action ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
            onClick={stat.action}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" onClick={() => navigate('/admin/products/add')}>
              <Package className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/products')}>
              <Package className="mr-2 h-4 w-4" />
              Manage Products
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/orders')}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Manage Orders
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/categories')}>
              <FolderTree className="mr-2 h-4 w-4" />
              Manage Categories
            </Button>
            <Button className="w-full justify-start" variant="destructive" onClick={() => {
              logout();
              navigate('/auth/login');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Info</CardTitle>
            <CardDescription>Application details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span className="font-medium">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Backup:</span>
                <span className="font-medium">Never</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
