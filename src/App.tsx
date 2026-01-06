import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from '@/stores/authStore';

// Lazy load auth pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Lazy load e-commerce pages
const Home = lazy(() => import("./pages/ecommerce/Home"));
const Shop = lazy(() => import("./pages/ecommerce/Shop"));
const ProductDetail = lazy(() => import("./pages/ecommerce/ProductDetail"));
const Cart = lazy(() => import("./pages/ecommerce/Cart"));
const Checkout = lazy(() => import("./pages/ecommerce/Checkout"));
const Orders = lazy(() => import("./pages/ecommerce/Orders"));
const EcommerceProfile = lazy(() => import("./pages/ecommerce/Profile"));

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AddProduct = lazy(() => import("./pages/admin/AddProduct"));
const EditProduct = lazy(() => import("./pages/admin/EditProduct"));

const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
