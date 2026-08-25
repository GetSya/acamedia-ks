import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { ShoppingBag, ChevronRight, Search, Filter, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrderManagement() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.sort((a: Order, b: Order) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (error) {
      toast.error('Gagal memuat orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatusMap: any = {
      'pending': 'sukses pembayaran',
      'sukses pembayaran': 'diproses',
      'diproses': 'selesai',
      'selesai': 'dibatalkan',
      'dibatalkan': 'pending'
    };
    const nextStatus = nextStatusMap[currentStatus];
    
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus, admin: 'Admin ACAMEDIA' }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Gagal update');
      toast.success(`Order ${orderId} diupdate ke ${nextStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'sukses pembayaran':
      case 'selesai': return 'success';
      case 'dibatalkan': return 'error';
      case 'diproses': return 'info';
      default: return 'info';
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
          <p className="text-gray-500">Total {orders.length} pesanan masuk</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari Order ID atau User..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Pembeli</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{order.order_id}</p>
                    <p className="text-xs text-gray-400">{JSON.parse(order.items).length} items</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 capitalize">{order.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-600">{formatCurrency(parseInt(order.total_price))}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.timestamp).split('pukul')[0]}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      className="p-2 h-auto"
                      onClick={() => handleUpdateStatus(order.order_id, order.status)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
