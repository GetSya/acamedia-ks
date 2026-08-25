import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { Card, Button } from '../components/UI';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type VerifyState = 'verifying' | 'success' | 'failed';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [state, setState] = useState<VerifyState>('verifying');
  const orderId = searchParams.get('order_id');
  // Mustika Payment menyertakan ref_no di redirect URL
  const refNo = searchParams.get('ref_no');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId || !token) {
        setState('failed');
        return;
      }

      try {
        // Jika ada ref_no dari Mustika, cek status dulu sebelum konfirmasi
        if (refNo) {
          const checkRes = await fetch(
            `/api/payment/check-qris?ref_no=${encodeURIComponent(refNo)}`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
              credentials: 'include'
            }
          );
          const checkData = await checkRes.json();

          // Hanya konfirmasi ke sheet jika status success dari Mustika
          if (checkData.status !== 'success') {
            setState('failed');
            return;
          }
        }

        // Konfirmasi pembayaran ke Google Sheet
        const res = await fetch('/api/orders/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ order_id: orderId }),
          credentials: 'include'
        });

        if (res.ok) {
          setState('success');
          toast.success('Pembayaran berhasil dikonfirmasi!');
        } else {
          // Jika sudah pernah dikonfirmasi sebelumnya via polling, tetap success
          const data = await res.json();
          if (data.status === 'sukses pembayaran') {
            setState('success');
          } else {
            setState('failed');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setState('failed');
      }
    };

    verifyPayment();
  }, [orderId, refNo, token]);

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card className="p-8 text-center flex flex-col items-center gap-6">
        {state === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900">Memverifikasi Pembayaran...</h1>
            <p className="text-gray-500">Mohon tunggu sebentar selagi kami mengonfirmasi transaksi Anda.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Pembayaran Sukses!</h1>
            <p className="text-gray-600">
              Terima kasih telah berbelanja di ACAMEDIA. Pesanan Anda{' '}
              <span className="font-bold text-gray-900">#{orderId}</span> sedang diproses.
            </p>
            <div className="flex flex-col w-full gap-3 mt-4">
              <Button onClick={() => navigate('/history')} className="w-full">
                Lihat Riwayat Pesanan
              </Button>
              <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full">
                Kembali ke Beranda
              </Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verifikasi Gagal</h1>
            <p className="text-gray-500 text-sm">
              Pembayaran belum terkonfirmasi atau terjadi kesalahan. Jika kamu sudah membayar, silakan hubungi admin dengan menyertakan nomor pesanan{' '}
              <span className="font-bold text-gray-700">#{orderId}</span>.
            </p>
            <div className="flex flex-col w-full gap-3 mt-2">
              <Button onClick={() => navigate('/history')} className="w-full">
                Cek Riwayat Pesanan
              </Button>
              <Button onClick={() => navigate('/marketplace')} variant="outline" className="w-full">
                Kembali ke Beranda
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
