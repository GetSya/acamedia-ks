import React, { useState, useEffect } from 'react';
import { Order, Item, Category, Information } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, List, Info, Users, 
  Settings, TrendingUp, Package, CheckCircle, Clock, MessageCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, itemsRes] = await Promise.all([
          fetch('/api/orders', { 
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/items')
        ]);
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          }
        }
        
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            setItems(itemsData);
          }
        }
      } catch (error) {
        toast.error('Gagal memuat data admin');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Total Penjualan', value: formatCurrency(orders.reduce((acc, o) => acc + parseInt(o.total_price), 0)), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pesanan Baru', value: orders.filter(o => o.status === 'pending').length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Produk', value: items.length, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pesanan Selesai', value: orders.filter(o => o.status === 'selesai').length, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // Dummy chart data from orders
  const chartData = orders.slice(-7).map(o => ({
    name: o.order_id.substring(4, 8),
    amount: parseInt(o.total_price)
  }));

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Overview performa ACAMEDIA hari ini</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/products">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" /> Kelola Produk
            </Button>
          </Link>
          <Link to="/admin/orders">
            <Button className="gap-2">
              <ShoppingBag className="w-4 h-4" /> Pesanan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-gray-900 mb-6">Analitik Penjualan Terbaru</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp ${v/1000}k`} />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Orders List */}
        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-6">Pesanan Baru</h3>
          <div className="space-y-4">
            {orders.slice(-5).reverse().map((order) => (
              <div key={order.order_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{order.order_id}</p>
                    <p className="text-xs text-gray-400">{order.username}</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-600 text-sm">{formatCurrency(parseInt(order.total_price))}</p>
              </div>
            ))}
            <Link to="/admin/orders" className="block text-center text-sm font-bold text-emerald-600 hover:emerald-700 pt-4">
              Lihat Semua Pesanan &rarr;
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/users">
          <Card className="p-6 hover:border-emerald-500 transition-all text-center">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900">Kelola Users</h4>
          </Card>
        </Link>
        <Link to="/admin/categories">
          <Card className="p-6 hover:border-emerald-500 transition-all text-center">
            <List className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900">Kategori</h4>
          </Card>
        </Link>
        <Link to="/admin/info">
          <Card className="p-6 hover:border-emerald-500 transition-all text-center">
            <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900">Informasi</h4>
          </Card>
        </Link>
        <Link to="/chat">
          <Card className="p-6 hover:border-emerald-500 transition-all text-center">
            <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-bold text-gray-900">Chat User</h4>
          </Card>
        </Link>
      </div>
    </div>
  );
}
