import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Card } from '../components/UI';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      setUser(result.user, result.token);
      toast.success('Selamat datang kembali!');
      navigate(result.user.role === 'admin' ? '/admin' : '/marketplace');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="p-8">
        <div className="text-center mb-8">
          <img src="https://files.catbox.moe/8kjeul.jpg" alt="ACAMEDIA" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg object-cover" />
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang</h1>
          <p className="text-gray-500">Masuk ke akun ACAMEDIA Anda</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Username"
            placeholder="Masukkan username Anda"
            registration={register('username')}
            error={errors.username?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Masukkan password Anda"
            registration={register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500">
            Belum punya akun?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
