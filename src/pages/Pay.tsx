import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { CheckCircle, Clock, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import QrisCropped from '../components/QrisCropped';

interface QrisData {
  order_id: string;
  ref_no: string;
  qr_url: string;
  payment_link: string;
  amount: number;
}

type PageState = 'init' | 'loading' | 'qris' | 'success' | 'expired' | 'error';

export default function Pay() {
  const [searchParams] = useSearchParams();
  const amount = Number(searchParams.get('pay') || searchParams.get('amount') || 0);
  const customOrderId = searchParams.get('order_id') || undefined;

  const [pageState, setPageState] = useState<PageState>('init');
  const [qrisData, setQrisData] = useState<QrisData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Auto-buat QRIS saat halaman dimuat jika amount valid
  useEffect(() => {
    if (amount >= 10) {
      createQris();
    }
    return () => clearTimers();
  }, []);

  const createQris = async () => {
    clearTimers();
    setPageState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment/manual-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, order_id: customOrderId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat QRIS');

      setQrisData(data);
      setTimeLeft(30 * 60);
      setPageState('qris');
      startPolling(data);
    } catch (err: any) {
      setErrorMsg(err.message);
      setPageState('error');
    }
  };

  const startPolling = (data: QrisData) => {
    // Polling setiap 5 detik
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/payment/manual-check?ref_no=${encodeURIComponent(data.ref_no)}&order_id=${encodeURIComponent(data.order_id)}`
        );
        const result = await res.json();

        if (result.status === 'success') {
          clearTimers();
          setPageState('success');
        } else if (result.status === 'expired') {
          clearTimers();
          setPageState('expired');
        }
      } catch {
        // silent — lanjut polling
      }
    };

    poll(); // cek langsung pertama kali
    pollingRef.current = setInterval(poll, 5000);

    // Countdown 30 menit
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimers();
          setPageState('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Amount tidak valid
  if (!amount || amount < 10) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Link Tidak Valid</h1>
          <p className="text-sm text-gray-500">
            Parameter <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">?pay=</code> tidak ditemukan atau nominal kurang dari Rp 10.
          </p>
          <p className="text-xs text-gray-400">Contoh: <span className="font-mono">...?pay=17000</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-emerald-600 px-6 py-5 text-white text-center">
          <p className="text-sm font-medium opacity-80 mb-1">Total Pembayaran</p>
          <p className="text-4xl font-black tracking-tight">{formatCurrency(amount)}</p>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-gray-500 text-sm">Membuat QRIS...</p>
            </div>
          )}

          {/* QRIS siap */}
          {pageState === 'qris' && qrisData && (
            <>
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full text-sm font-medium w-full justify-center">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Menunggu pembayaran · {formatTime(timeLeft)}</span>
              </div>

              <div className="p-2 border-2 border-emerald-200 rounded-xl bg-white shadow-inner">
                <QrisCropped
                  src={qrisData.qr_url}
                  alt="QRIS Code"
                  className="w-72 h-72 object-contain"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs text-gray-400">Scan dengan GoPay, OVO, DANA, ShopeePay, dan lainnya</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 flex-shrink-0" />
                <span>Mengecek status otomatis setiap 5 detik...</span>
              </div>

              <a
                href={qrisData.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-700 font-medium"
              >
                Bayar via link (tanpa scan)
              </a>

              <p className="text-xs text-gray-400 font-mono">
                Order: #{qrisData.order_id}
              </p>
            </>
          )}

          {/* Sukses */}
          {pageState === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Pembayaran Berhasil!</h2>
              <p className="text-sm text-gray-500">
                Terima kasih! Pembayaran sebesar{' '}
                <span className="font-semibold text-gray-700">{formatCurrency(amount)}</span>{' '}
                telah dikonfirmasi.
              </p>
              {qrisData && (
                <p className="text-xs text-gray-400 font-mono">Order: #{qrisData.order_id}</p>
              )}
            </div>
          )}

          {/* Expired */}
          {pageState === 'expired' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">QR Kadaluarsa</h2>
              <p className="text-sm text-gray-500">
                Waktu pembayaran habis. Buat QR baru untuk melanjutkan.
              </p>
              <button
                onClick={createQris}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Perbarui QR Code
              </button>
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Terjadi Kesalahan</h2>
              <p className="text-sm text-gray-500">{errorMsg || 'Gagal membuat QRIS. Silakan coba lagi.'}</p>
              <button
                onClick={createQris}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 text-center">
          <p className="text-xs text-gray-400">Powered by Mustika Payment · Transaksi Aman & Terenkripsi</p>
        </div>
      </div>
    </div>
  );
}
