import React, { useState, useEffect } from 'react';
import { Item, Category } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingCart, Filter, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Marketplace() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, catsRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/categories')
        ]);
        
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (Array.isArray(itemsData)) {
            setItems(itemsData);
          }
        }
        
        if (catsRes.ok) {
          const catsData = await catsRes.json();
          if (Array.isArray(catsData)) {
            setCategories(catsData);
          }
        }
      } catch (error) {
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nama_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.kategori_id === selectedCategory;
    const isActive = item.aktif === 'TRUE' || item.aktif === '1' || item.aktif === 'true';
    return matchesSearch && matchesCategory && isActive;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aIsFlash = a.flashsale && new Date(a.flashsale) > new Date();
    const bIsFlash = b.flashsale && new Date(b.flashsale) > new Date();
    if (aIsFlash && !bIsFlash) return -1;
    if (!aIsFlash && bIsFlash) return 1;
    return 0;
  });

  const handleAddToCart = (item: Item) => {
    addItem({
      kode_item: item.kode_item,
      nama_item: item.nama_item,
      harga_jual: parseInt(item.harga_jual),
      quantity: 1,
      image_url: item.image_url,
      diskon: item.diskon ? parseInt(item.diskon) : undefined,
      flashsale: item.flashsale
    });
    toast.success(`${item.nama_item} ditambahkan ke keranjang`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="animate-pulse bg-white rounded-2xl h-80 border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-linear-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
            <img src="https://files.catbox.moe/8kjeul.jpg" alt="" className="w-8 h-8 rounded-lg" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Marketplace Digital Terpercaya</h2>
          <p className="opacity-90 text-sm md:text-base max-w-md">Dapatkan source code production-ready dan aset digital eksklusif dari ACAMEDIA.</p>
        </div>
        <Button className="bg-white text-emerald-700 hover:bg-emerald-50 hidden sm:flex relative z-10">Explore Deals</Button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Marketplace</h1>
          <p className="text-gray-500">Temukan produk digital terbaik untuk kebutuhan Anda</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none w-full sm:w-48 bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.kategori_id} value={cat.kategori_id}>{cat.kategori_nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {sortedItems.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <SearchIcon className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Produk tidak ditemukan</h3>
          <p className="text-gray-500">Coba gunakan kata kunci atau filter lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedItems.map((item, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              key={item.kode_item}
            >
              {(() => {
                const isFlash = item.flashsale && new Date(item.flashsale) > new Date();
                return (
                  <Card className={cn("p-0 overflow-hidden group h-full flex flex-col hover:shadow-xl transition-all duration-300 border", isFlash ? "border-emerald-500 shadow-emerald-500/10 shadow-lg" : "border-gray-100 shadow-emerald-500/5")}>
                    <Link to={`/product/${item.kode_item}`} className="relative block aspect-[4/3] overflow-hidden">
                      <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600'} 
                        alt={item.nama_item}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant={isFlash ? 'warning' : 'success'}>{isFlash ? '⚡ Flash Sale' : item.durasi}</Badge>
                      </div>
                    </Link>
                    
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="mb-3">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">
                          {categories.find(c => c.kategori_id === item.kategori_id)?.kategori_nama || 'Digital'}
                        </p>
                        <Link to={`/product/${item.kode_item}`}>
                          <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.nama_item}
                          </h3>
                        </Link>
                      </div>
                      
                      <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                        <div className="flex flex-col">
                          {isFlash ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">{formatCurrency(parseInt(item.harga_jual))}</span>
                              <span className="text-lg font-black text-emerald-600">{formatCurrency(parseInt(item.diskon))}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-gray-400">Harga Jual</span>
                              <span className="text-lg font-black text-gray-900">{formatCurrency(parseInt(item.harga_jual))}</span>
                            </>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleAddToCart(item)}
                          className={cn("w-10 h-10 p-0 rounded-full", isFlash ? "bg-emerald-600 hover:bg-emerald-700" : "")}
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })()}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
