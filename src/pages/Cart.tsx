import React from 'react';
import { useCartStore, useAuthStore } from '../store/useStore';
import { Card, Button } from '../components/UI';
import { formatCurrency } from '../lib/utils';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Cart() {
  const { items, removeItem, updateQuantity } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const totalPrice = items.reduce((acc, item) => {
    const isFlash = item.flashsale && new Date(item.flashsale) > new Date();
    const price = isFlash && typeof item.diskon === 'number' ? item.diskon : item.harga_jual;
    return acc + (price * item.quantity);
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-50 text-gray-300">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Keranjang Kosong</h2>
        <p className="text-gray-500">Anda belum menambahkan produk apapun ke keranjang.</p>
        <Link to="/marketplace">
          <Button className="mt-4">Jelajahi Produk</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Keranjang Belanja</h1>
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.kode_item} className="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-center">
              <div className="flex gap-4 items-center w-full">
                <img 
                  src={item.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f'} 
                  alt={item.nama_item}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.nama_item}</h3>
                  <p className="text-emerald-600 font-bold text-sm sm:text-base">{formatCurrency(item.harga_jual)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                  <button 
                    onClick={() => updateQuantity(item.kode_item, Math.max(1, item.quantity - 1))}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors active:scale-95"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.kode_item, item.quantity + 1)}
                    className="p-1.5 hover:bg-white rounded-lg transition-colors active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    removeItem(item.kode_item);
                    toast.success('Produk dihapus');
                  }}
                  className="p-2 sm:p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all flex items-center gap-2 text-xs font-bold sm:text-base group"
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="sm:hidden">Hapus</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-6 sticky top-24 border-emerald-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Ringkasan Pesanan</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal ({items.length} item)</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Pajak (0%)</span>
              <span>Rp 0</span>
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between">
              <span className="font-bold text-gray-900">Total Harga</span>
              <span className="font-black text-xl text-emerald-600">{formatCurrency(totalPrice)}</span>
            </div>
          </div>
          <Button onClick={handleCheckout} className="w-full h-12 text-lg">
            Checkout Sekarang <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-xs text-gray-400 text-center mt-4">
            Harga sudah termasuk pajak dan biaya layanan digital minimal.
          </p>
        </Card>
      </div>
    </div>
  );
}
