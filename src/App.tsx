import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";

// E-commerce pages
import Home from "./pages/ecommerce/Home";
import Shop from "./pages/ecommerce/Shop";
import ProductDetail from "./pages/ecommerce/ProductDetail";
import Cart from "./pages/ecommerce/Cart";
import Checkout from "./pages/ecommerce/Checkout";
import Orders from "./pages/ecommerce/Orders";
import EcommerceProfile from "./pages/ecommerce/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";

import NotFound from "./pages/NotFound";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // On app start, try to silently restore session via refresh endpoint.
    // This will set a memory-only access token when successful and persist only non-sensitive user profile.
    (async () => {
      try {
        await useAuthStore.getState().tryRestoreSession();
      } catch (e) {
        // restore failed -> client state already cleared by tryRestoreSession
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Protected E-commerce Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><EcommerceProfile /></ProtectedRoute>} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requiredRole="ADMIN"><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute requiredRole="ADMIN"><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/products/add" element={<ProtectedRoute requiredRole="ADMIN"><AddProduct /></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute requiredRole="ADMIN"><EditProduct /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute requiredRole="ADMIN"><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute requiredRole="ADMIN"><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/promos" element={<ProtectedRoute requiredRole="ADMIN"><AdminPromoCodes /></ProtectedRoute>} />

          {/* Fallback Routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
