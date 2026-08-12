'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '@/features/accounts/services/accountService';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login({ email, password });
            if (data.user.role !== 'ADMIN') {
                setError('Tài khoản này không có quyền truy cập trang quản trị');
                setLoading(false);
                return;
            }
            setAuth(data.user);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-[480px] rounded-2xl border border-slate-100 bg-white p-10 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)]">
                <div className="mb-2 flex justify-center">
                    <Image src="/logo.png" alt="JVN" width={72} height={84} priority />
                </div>
                <h1 className="mb-1 text-center text-xl font-bold text-slate-800">
                    Đăng nhập Quản trị viên
                </h1>
                <p className="mb-7 text-center text-sm text-slate-500">
                    Khu vực nội bộ — chỉ dành cho Admin
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email" required value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'} required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-500"
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                    <button
                        type="submit" disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-800 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-900 disabled:opacity-60"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}