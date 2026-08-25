import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Item, Review } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { ShoppingCart, Star, MessageCircle, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore, useCartStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { code } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemRes = await fetch('/api/items');
        const items: Item[] = await itemRes.json();
        const found = items.find(i => i.kode_item === code);
        setItem(found || null);

        const reviewRes = await fetch(`/api/reviews/${code}`);
        setReviews(await reviewRes.json());
      } catch (error) {
        toast.error('Gagal memuat detail produk');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [code]);

  const handleAddToCart = () => {
    if (!item) return;
    const isFlash = item.flashsale && new Date(item.flashsale) > new Date();
    addItem({
      kode_item: item.kode_item,
      nama_item: item.nama_item,
      harga_jual: isFlash ? parseInt(item.diskon || item.harga_jual) : parseInt(item.harga_jual),
      quantity: 1,
      image_url: item.image_url,
      diskon: item.diskon ? parseInt(item.diskon) : undefined,
      flashsale: item.flashsale
    });
    toast.success('Produk ditambahkan ke keranjang');
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat detail...</div>;
  if (!item) return <div className="py-20 text-center text-red-500">Produk tidak ditemukan</div>;

  return (
    <div className="space-y-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Image */}
        <div className="space-y-4">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-gray-100 shadow-sm relative">
            <img 
              src={item.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f'} 
              alt={item.nama_item}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Durasi</p>
                <p className="font-bold text-gray-900">{item.durasi}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Garansi</p>
                <p className="font-bold text-gray-900">Digital Safe</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="info">Digital Item</Badge>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">{item.nama_item}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-gray-900">4.9</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{reviews.length} Ulasan</span>
              </div>
              <span>•</span>
              <span>Terjual 100+</span>
            </div>
          </div>

          <div className={cn("rounded-2xl p-6 border", 
            item.flashsale && new Date(item.flashsale) > new Date() ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100"
          )}>
            <span className={cn("text-sm font-semibold mb-1 block", 
              item.flashsale && new Date(item.flashsale) > new Date() ? "text-orange-600" : "text-emerald-600"
            )}>
              {item.flashsale && new Date(item.flashsale) > new Date() ? 'Harga Flash Sale' : 'Harga Sekarang'}
            </span>
            <div className="flex items-baseline gap-3">
              {item.flashsale && new Date(item.flashsale) > new Date() ? (
                <>
                  <span className="text-3xl font-black text-orange-700">{formatCurrency(parseInt(item.diskon))}</span>
                  <span className="text-lg text-gray-500 line-through">{formatCurrency(parseInt(item.harga_jual))}</span>
                </>
              ) : (
                <span className="text-3xl font-black text-emerald-700">{formatCurrency(parseInt(item.harga_jual))}</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Deskripsi Produk</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {item.description || 'Tidak ada deskripsi untuk produk ini.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button onClick={handleBuyNow} className="flex-1 h-14 text-lg">Beli Sekarang</Button>
            <Button onClick={handleAddToCart} variant="outline" className="flex-1 h-14 text-lg">
              <ShoppingCart className="w-5 h-5" /> Tambah Keranjang
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="pt-12 space-y-6 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Ulasan Pengguna</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Belum ada ulasan untuk produk ini.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((rev) => (
              <Card key={rev._rowIndex} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "w-4 h-4", 
                          i < parseInt(rev.rating) ? "text-amber-400 fill-current" : "text-gray-200"
                        )} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 italic">{formatDate(rev.timestamp)}</span>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed font-italic">"{rev.ulasan}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    {rev.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{rev.username}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
