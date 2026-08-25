import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Card, Badge, Button } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { Package, ChevronRight, Clock, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function HistoryOrder() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        toast.error('Gagal memuat history order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat riwayat...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Pesanan</h1>
        <Link to="/chat">
          <Button variant="ghost" className="text-emerald-600">
            <MessageCircle className="w-5 h-5" /> Chat Admin
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 text-gray-200 mb-4">
            <Package className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Belum ada pesanan</h3>
          <p className="text-gray-500">Ayo mulai belanja produk digital impianmu.</p>
          <Link to="/marketplace">
            <Button className="mt-6">Lanjut Belanja</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = JSON.parse(order.items);
            const statusVariants = {
              pending: 'warning',
              diproses: 'info',
              selesai: 'success',
              dibatalkan: 'error',
              'sukses pembayaran': 'success',
            } as const;

            return (
              <Card key={order.order_id} className="p-0 overflow-hidden border-gray-100 hover:border-emerald-200 transition-all">
                <div className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{order.order_id}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(order.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariants[order.status]}>{order.status.toUpperCase()}</Badge>
                  </div>

                  <div className="space-y-4">
                    {items.map((item: any) => (
                      <div key={item.kode_item} className="flex gap-4 items-center">
                        <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        <div className="flex-grow">
                          <p className="font-bold text-gray-900">{item.nama_item}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.harga_jual)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Harga</p>
                      <p className="text-xl font-black text-gray-900">{formatCurrency(parseInt(order.total_price))}</p>
                    </div>
                    {order.noted && (
                      <div className="hidden sm:block max-w-[200px]">
                        <p className="text-xs text-gray-400 font-medium italic truncate">"{order.noted}"</p>
                      </div>
                    )}
                    <Link to={`/invoice?order_id=${order.order_id}`}>
                      <Button variant="outline">
                        Detail <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
