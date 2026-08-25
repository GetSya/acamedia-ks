import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button, Input, Card } from '../components/UI';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const registerSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      
      toast.success('Pendaftaran berhasil! Silakan login.');
      navigate('/login');
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
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun</h1>
          <p className="text-gray-500">Bergabung dengan komunitas ACAMEDIA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            registration={register('nama_lengkap')}
            error={errors.nama_lengkap?.message}
          />
          <Input
            label="Username"
            placeholder="Pilih username"
            registration={register('username')}
            error={errors.username?.message}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Masukkan alamat email"
            registration={register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            registration={register('password')}
            error={errors.password?.message}
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            registration={register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Masuk Disini
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
