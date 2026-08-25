import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Order } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { formatCurrency, formatDate } from '../lib/utils';
import { Printer, Download, CheckCircle, Package, Clock, User, Hash, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Invoice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const fetchAndVerify = async () => {
      if (!orderId || !token) {
        setLoading(false);
        return;
      }

      try {
        // 1. First, verify payment to ensure status is updated
        await fetch('/api/orders/verify-payment', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order_id: orderId }),
          credentials: 'include'
        });

        // 2. Then fetch the full order details
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (!res.ok) throw new Error('Order tidak ditemukan');
        const data = await res.json();
        setOrder(data);
      } catch (error: any) {
        console.error('Invoice error:', error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAndVerify();
  }, [orderId, token]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Invoice tidak ditemukan</h2>
        <Button onClick={() => navigate('/history')}>Kembali ke Riwayat</Button>
      </div>
    );
  }

  const items = JSON.parse(order.items || '[]');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => navigate('/history')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Cetak Invoice
          </Button>
        </div>
      </div>

      <Card className="p-8 shadow-xl bg-white border-none rounded-2xl overflow-hidden relative">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
          <div>
            <h1 className="text-3xl font-black text-emerald-600 mb-1">ACAMEDIA</h1>
            <p className="text-gray-500 font-medium">Marketplace Kursus & Layanan Digital</p>
          </div>
          <div className="text-right md:text-right w-full md:w-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-wider text-right">INVOICE</h2>
            <div className="flex items-center justify-end gap-2 text-gray-500 mb-1">
              <Hash className="w-4 h-4" />
              <span className="font-mono text-lg font-semibold text-gray-900">{order.order_id}</span>
            </div>
            <div className="flex items-center justify-end gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDate(order.timestamp)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tagihan Untuk</h3>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900">{user?.nama_lengkap || order.username}</p>
                <p className="text-gray-500">@{order.username}</p>
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Status Transaksi</h3>
            <div className="inline-flex">
              <Badge 
                variant={
                  order.status === 'selesai' || order.status === 'sukses pembayaran' ? 'success' : 
                  order.status === 'pending' ? 'warning' : 
                  order.status === 'dibatalkan' ? 'error' : 'info'
                }
                className="text-sm py-1 px-4 rounded-full font-bold uppercase tracking-wide"
              >
                {order.status === 'sukses pembayaran' ? 'LUNAS' : order.status.toUpperCase()}
              </Badge>
            </div>
            {order.status === 'sukses pembayaran' && (
              <div className="mt-3 flex items-center justify-end gap-2 text-emerald-600 font-medium text-sm">
                <CheckCircle className="w-4 h-4" />
                Dikonfirmasi Otomatis
              </div>
            )}
          </div>
        </div>

        <div className="mb-12 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-4 px-2 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Item Pesanan</th>
                <th className="py-4 px-2 text-center text-sm font-bold text-gray-900 uppercase tracking-wider">Qty</th>
                <th className="py-4 px-2 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">Harga</th>
                <th className="py-4 px-2 text-right text-sm font-bold text-gray-900 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="font-medium text-gray-900">{item.nama_item}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-4 px-2 text-right text-gray-600">{formatCurrency(item.harga_jual)}</td>
                  <td className="py-4 px-2 text-right font-semibold text-gray-900">{formatCurrency(item.harga_jual * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="md:w-1/2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Catatan</h3>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[80px] text-gray-600 text-sm italic">
              {order.noted || 'Tidak ada catatan tambahan.'}
            </div>
          </div>
          <div className="md:w-1/3 bg-emerald-50 p-6 rounded-2xl">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(parseInt(order.total_price))}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Biaya Layanan</span>
                <span>{formatCurrency(0)}</span>
              </div>
              <div className="border-t border-emerald-200 pt-3 flex justify-between">
                <span className="text-lg font-black text-gray-900">TOTAL</span>
                <span className="text-xl font-black text-emerald-700">{formatCurrency(parseInt(order.total_price))}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm mb-1">Terima kasih atas kepercayaan Anda kepada ACAMEDIA</p>
          <p className="text-gray-400 text-xs font-mono">ID TRANSAKSI: {order.order_id}</p>
        </div>
      </Card>
      
      <p className="mt-6 text-center text-gray-500 text-sm print:hidden italic">
        Silakan simpan invoice ini sebagai bukti pembayaran yang sah.
      </p>
    </div>
  );
}
