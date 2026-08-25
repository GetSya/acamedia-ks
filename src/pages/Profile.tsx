import React, { useState } from 'react';
import { useAuthStore } from '../store/useStore';
import { Card, Button } from '../components/UI';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser, token } = useAuthStore();
  const [nama_lengkap, setNamaLengkap] = useState(user?.nama_lengkap || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nama_lengkap, email, password: password || undefined }),
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Gagal mengupdate profile');

      // Update local store
      setUser({ ...user!, nama_lengkap, email }, token);
      toast.success('Profile berhasil diupdate');
      setPassword('');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={nama_lengkap} 
              onChange={(e) => setNamaLengkap(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password Baru (kosongkan jika tidak ingin mengubah)</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Mengupdate...' : 'Simpan Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
