import React, { useState, useEffect, useRef } from 'react';
import { useCartStore, useAuthStore } from '../store/useStore';
import { Card, Button, Badge } from '../components/UI';
import { formatCurrency } from '../lib/utils';
import { CreditCard, Truck, Shield, Loader2, X, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import QrisCropped from '../components/QrisCropped';

interface QrisData {
  ref_no: string;
  qr_url: string;
  payment_link: string;
  amount: number;
}

type QrisStatus = 'pending' | 'success' | 'expired';

export default function Checkout() {
  const { items, clearCart } = useCartStore();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [noted, setNoted] = useState('');
  const [loading, setLoading] = useState(false);

  // QRIS modal state
  const [qrisData, setQrisData] = useState<QrisData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrisStatus, setQrisStatus] = useState<QrisStatus>('pending');
  const [pollingActive, setPollingActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 menit dalam detik
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/marketplace');
    }
  }, [items.length, navigate]);

  // Polling status QRIS setiap 5 detik
  useEffect(() => {
    if (!pollingActive || !qrisData || !token) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment/check-qris?ref_no=${encodeURIComponent(qrisData.ref_no)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        const data = await res.json();

        if (data.status === 'success') {
          setQrisStatus('success');
          setPollingActive(false);
          clearPolling();
          // Update status order di sheet
          await fetch('/api/orders/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ order_id: orderId }),
            credentials: 'include'
          });
          toast.success('Pembayaran berhasil dikonfirmasi!');
          clearCart();
        } else if (data.status === 'expired') {
          setQrisStatus('expired');
          setPollingActive(false);
          clearPolling();
        }
      } catch {
        // silent — tetap polling
      }
    };

    poll(); // langsung cek pertama kali
    pollingRef.current = setInterval(poll, 5000);

    return () => clearPolling();
  }, [pollingActive, qrisData, token]);

  // Countdown timer 30 menit
  useEffect(() => {
    if (!pollingActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearPolling();
          setPollingActive(false);
          setQrisStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pollingActive]);

  const clearPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const totalPrice = items.reduce((acc, item) => acc + (item.harga_jual * item.quantity), 0);

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // 1. Buat order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items, total_price: totalPrice, noted }),
        credentials: 'include'
      });
      const orderResult = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderResult.message);

      const newOrderId = orderResult.order_id;
      setOrderId(newOrderId);

      // 2. Buat QRIS via Mustika Payment
      const qrisRes = await fetch('/api/payment/create-qris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: newOrderId,
          amount: totalPrice,
          product_name: items.map(i => i.nama_item).join(', ').slice(0, 50),
          customer_name: user?.nama_lengkap || user?.username
        }),
        credentials: 'include'
      });
      const qrisResult = await qrisRes.json();
      if (!qrisRes.ok) throw new Error(qrisResult.message);

      setQrisData(qrisResult);
      setQrisStatus('pending');
      setTimeLeft(30 * 60);
      setPollingActive(true);
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    clearPolling();
    setPollingActive(false);
    setQrisData(null);
    setQrisStatus('pending');
    if (qrisStatus === 'success') {
      navigate('/history');
    }
  };

  const handleRetryQris = async () => {
    if (!orderId || !token) return;
    setLoading(true);
    try {
      const qrisRes = await fetch('/api/payment/create-qris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: totalPrice,
          product_name: items.map(i => i.nama_item).join(', ').slice(0, 50),
          customer_name: user?.nama_lengkap || user?.username
        }),
        credentials: 'include'
      });
      const qrisResult = await qrisRes.json();
      if (!qrisRes.ok) throw new Error(qrisResult.message);

      setQrisData(qrisResult);
      setQrisStatus('pending');
      setTimeLeft(30 * 60);
      setPollingActive(true);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui QRIS');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (items.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" /> Informasi Pengiriman Digital
            </h2>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="font-bold text-gray-900">{user?.nama_lengkap}</p>
              <p className="text-gray-500 text-sm">{user?.username} | digital-access@acamedia.id</p>
              <p className="text-xs text-gray-400 mt-2 italic">Akses produk digital akan dikirim melalui email dan tersedia di dashboard setelah pembayaran dikonfirmasi.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Catatan Pesanan (Optional)</label>
              <textarea
                className="w-full bg-white border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                rows={3}
                placeholder="Contoh: Kirim akses ke akun email utama saya yang tertulis..."
                value={noted}
                onChange={(e) => setNoted(e.target.value)}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Metode Pembayaran
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 border-2 border-emerald-500 bg-emerald-50 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-emerald-700">Mustika Payment (QRIS)</p>
                  <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">QRIS</span>
                </div>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Bayar dengan QRIS — bisa di-scan oleh GoPay, OVO, DANA, ShopeePay, Bank Mandiri Livin, BCA Mobile, dan aplikasi pembayaran lainnya.
                </p>
                <div className="mt-2 flex gap-1 items-center">
                  <Badge variant="success">Otomatis</Badge>
                  <Badge variant="info">Aman</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6 border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="w-24 h-24 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Detail Tagihan</h2>
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.kode_item} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.nama_item} x {item.quantity}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.harga_jual * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="font-bold text-gray-900">Total Pembayaran</span>
                <span className="font-black text-2xl text-emerald-600">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            <Button
              onClick={handlePlaceOrder}
              className="w-full h-14 text-xl shadow-lg shadow-emerald-600/20"
              disabled={loading}
            >
              {loading ? 'Memproses Pesanan...' : 'Bayar Sekarang'}
            </Button>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <Shield className="w-4 h-4 text-emerald-500" /> Jaminan Transaksi Aman & Terenkripsi
            </div>
          </Card>
        </div>
      </div>

      {/* Modal QRIS */}
      {qrisData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Scan QRIS untuk Membayar</h3>
                <p className="text-xs text-gray-400 mt-0.5">Order #{orderId}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-4">
              {/* Status: Pending — tampilkan QR */}
              {qrisStatus === 'pending' && (
                <>
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Menunggu pembayaran · {formatTime(timeLeft)}</span>
                  </div>

                  <div className="p-2 border-2 border-emerald-200 rounded-xl bg-white shadow-inner">
                    <QrisCropped
                      src={qrisData.qr_url}
                      alt="QRIS Code"
                      className="w-full max-w-xs object-contain"
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(qrisData.amount)}</p>
                    <p className="text-xs text-gray-400">Scan dengan aplikasi pembayaran apapun</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>Mengecek status otomatis setiap 5 detik...</span>
                  </div>

                  <a
                    href={qrisData.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
                  >
                    Bayar via link (tanpa scan)
                  </a>
                </>
              )}

              {/* Status: Success */}
              {qrisStatus === 'success' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Pembayaran Berhasil!</h4>
                  <p className="text-sm text-gray-500 text-center">
                    Terima kasih! Pesanan <span className="font-semibold text-gray-700">#{orderId}</span> sedang diproses.
                  </p>
                  <Button onClick={() => navigate('/history')} className="w-full">
                    Lihat Riwayat Pesanan
                  </Button>
                </div>
              )}

              {/* Status: Expired */}
              {qrisStatus === 'expired' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <Clock className="w-12 h-12 text-red-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">QR Kadaluarsa</h4>
                  <p className="text-sm text-gray-500 text-center">
                    Waktu pembayaran habis. Klik tombol di bawah untuk memperbarui QR Code.
                  </p>
                  <Button onClick={handleRetryQris} disabled={loading} className="w-full flex items-center justify-center gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Memperbarui...' : 'Perbarui QR Code'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
