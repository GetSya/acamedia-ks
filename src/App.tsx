import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuthStore } from './store/useStore';

// Pages
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import HistoryOrder from './pages/HistoryOrder';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ChatPage from './pages/Chat.tsx';
import PaymentSuccess from './pages/PaymentSuccess';
import Invoice from './pages/Invoice';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrderManagement from './pages/AdminOrderManagement';
import AdminProductManagement from './pages/AdminProductManagement';
import Pay from './pages/Pay';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const { setUser, token } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const result = await res.json();
          setUser(result.user, token);
        } else if (token) {
          setUser(null, null);
        }
      } catch (error) {
        console.error('Session sync failed');
      }
    };
    checkAuth();
  }, [setUser, token]);

  return (
    <Router>
      <Routes>
        {/* Halaman publik standalone — tanpa Layout (untuk bot Telegram) */}
        <Route path="/pay" element={<Pay />} />

        {/* Semua route lain pakai Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/marketplace" />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/product/:code" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />

              {/* User Protected Routes */}
              <Route 
                path="/checkout" 
                element={<ProtectedRoute><Checkout /></ProtectedRoute>} 
              />
              <Route 
                path="/history" 
                element={<ProtectedRoute><HistoryOrder /></ProtectedRoute>} 
              />
              <Route 
                path="/payment-success" 
                element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} 
              />
              <Route 
                path="/invoice" 
                element={<ProtectedRoute><Invoice /></ProtectedRoute>} 
              />
              <Route 
                path="/chat" 
                element={<ProtectedRoute><ChatPage /></ProtectedRoute>} 
              />
              <Route 
                path="/profile" 
                element={<ProtectedRoute><Profile /></ProtectedRoute>} 
              />

              {/* Admin Protected Routes */}
              <Route 
                path="/admin" 
                element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} 
              />
              <Route 
                path="/admin/orders" 
                element={<ProtectedRoute role="admin"><AdminOrderManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/admin/products" 
                element={<ProtectedRoute role="admin"><AdminProductManagement /></ProtectedRoute>} 
              />
              <Route 
                path="/admin/users" 
                element={<ProtectedRoute role="admin"><div className="py-20 text-center">Admin User Management (WIP)</div></ProtectedRoute>} 
              />
              <Route 
                path="/admin/categories" 
                element={<ProtectedRoute role="admin"><div className="py-20 text-center">Admin Categories CRUD (WIP)</div></ProtectedRoute>} 
              />
              <Route 
                path="/admin/info" 
                element={<ProtectedRoute role="admin"><div className="py-20 text-center">Admin Information CRUD (WIP)</div></ProtectedRoute>} 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Router>
  );
}
