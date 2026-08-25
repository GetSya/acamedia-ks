import React, { useState, useEffect } from 'react';
import { Item, Category } from '../types';
import { Card, Button, Input, Badge } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { Package, Search, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const itemSchema = z.object({
  kode_item: z.string().min(1, 'Kode wajib diisi'),
  nama_item: z.string().min(1, 'Nama wajib diisi'),
  durasi: z.string().min(1, 'Durasi wajib diisi'),
  kategori_id: z.string().min(1, 'Kategori wajib diisi'),
  stok: z.string().min(1, 'Stok wajib diisi'),
  harga_jual: z.string().min(1, 'Harga wajib diisi'),
  diskon: z.string().optional(),
  flashsale: z.string().optional(),
  aktif: z.string(),
  description: z.string().optional(),
  image_url: z.string().url('URL gambar tidak valid').or(z.string().length(0)),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function AdminProductManagement() {
  const { token } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { aktif: 'TRUE' }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/categories')
      ]);
      const itemsData = await itemsRes.json();
      const catsData = await catsRes.json();
      if (Array.isArray(itemsData)) setItems(itemsData);
      if (Array.isArray(catsData)) setCategories(catsData);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: ItemFormValues) => {
    try {
      const url = editingItem 
        ? `/api/admin/items/${editingItem.kode_item}` 
        : '/api/admin/items';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan produk');
      }
      
      toast.success(editingItem ? 'Produk diupdate' : 'Produk ditambahkan');
      setIsModalOpen(false);
      setEditingItem(null);
      reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setValue('kode_item', item.kode_item);
    setValue('nama_item', item.nama_item);
    setValue('durasi', item.durasi);
    setValue('kategori_id', item.kategori_id);
    setValue('stok', item.stok);
    setValue('harga_jual', item.harga_jual);
    setValue('diskon', item.diskon);
    setValue('flashsale', item.flashsale);
    setValue('aktif', item.aktif === 'TRUE' || item.aktif === '1' || item.aktif === 'true' ? 'TRUE' : 'FALSE');
    setValue('description', item.description);
    setValue('image_url', item.image_url);
    setIsModalOpen(true);
  };

  const handleDelete = async (kode: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini? (Akan diubah menjadi tidak aktif)')) return;
    try {
      const res = await fetch(`/api/admin/items/${kode}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Produk dinonaktifkan');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    reset({
      kode_item: 'P-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      nama_item: '',
      durasi: 'Forever',
      kategori_id: categories[0]?.kategori_id || '',
      stok: '99',
      harga_jual: '',
      diskon: '0',
      flashsale: '',
      aktif: 'TRUE',
      description: '',
      image_url: ''
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(i => 
    i.nama_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.kode_item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="py-20 text-center text-gray-500">Memuat produk...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Produk</h1>
          <p className="text-gray-500">Total {items.length} produk terdaftar</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Produk
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produk</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => (
                <tr key={item.kode_item} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image_url || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-gray-900">{item.nama_item}</p>
                        <p className="text-xs text-gray-400">{item.kode_item}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {categories.find(c => c.kategori_id === item.kategori_id)?.kategori_nama || item.kategori_id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.stok}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-emerald-600 text-sm">{formatCurrency(parseInt(item.harga_jual))}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={item.aktif === 'TRUE' || item.aktif === '1' || item.aktif === 'true' ? 'success' : 'error'}>
                      {item.aktif === 'TRUE' || item.aktif === '1' || item.aktif === 'true' ? 'AKTIF' : 'NONAKTIF'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" className="p-2 h-auto" onClick={() => handleEdit(item)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="p-2 h-auto text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.kode_item)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-600 text-white">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-grow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Kode Item" registration={register('kode_item')} error={errors.kode_item?.message} />
                <Input label="Nama Produk" registration={register('nama_item')} error={errors.nama_item?.message} />
                <Input label="Durasi" placeholder="e.g. Forever, 1 Month" registration={register('durasi')} error={errors.durasi?.message} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Kategori</label>
                  <select 
                    {...register('kategori_id')}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {categories.map(c => <option key={c.kategori_id} value={c.kategori_id}>{c.kategori_nama}</option>)}
                  </select>
                </div>
                <Input label="Stok" registration={register('stok')} error={errors.stok?.message} />
                <Input label="Harga Jual" registration={register('harga_jual')} error={errors.harga_jual?.message} />
                <Input label="Diskon" registration={register('diskon')} error={errors.diskon?.message} />
                <Input label="Flashsale (Waktu Berakhir)" type="datetime-local" registration={register('flashsale')} error={errors.flashsale?.message} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Status Keaktifan</label>
                  <select 
                    {...register('aktif')}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="TRUE">Aktif</option>
                    <option value="FALSE">Nonaktif</option>
                  </select>
                </div>
                <Input label="URL Gambar" registration={register('image_url')} error={errors.image_url?.message} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 ml-1">Deskripsi</label>
                <textarea 
                  {...register('description')}
                  rows={4}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
              </div>

              <div className="pt-4 flex gap-4">
                <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="flex-1">Batal</Button>
                <Button type="submit" className="flex-1 gap-2">
                  <Save className="w-4 h-4" /> {editingItem ? 'Simpan Perubahan' : 'Tambah Produk'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
