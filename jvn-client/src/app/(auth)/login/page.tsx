// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { login } from '@/features/accounts/services/accountService';
import { getRedirectByRole } from '@/utils/getRedirectPathByRole';

export default function LoginPage() {
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
            setAuth(data.user);
            router.push(getRedirectByRole(data.user.role));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Email hoặc mật khẩu không chính xác');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
            {/* Họa tiết góc trái - chấm bi, tông xanh dương thay cho xanh lá TopCV */}
            <div className="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 md:block">
                <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
                    <defs>
                        <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.6" fill="#2563eb" opacity="0.55" />
                        </pattern>
                    </defs>
                    <polygon points="0,60 130,190 100,220 0,120" fill="url(#dots)" />
                    <polygon points="0,0 170,170 150,190 0,40" fill="url(#dots)" opacity="0.7" />
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-[480px] rounded-2xl border border-slate-100 bg-white p-10 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)]">
                {/* Logo */}
                <div className="mb-2 flex justify-center">
                    <Image src="/logo.png" alt="JVN" width={96} height={112} priority />
                </div>
                <h1 className="mb-8 text-center text-xl font-bold text-slate-800">
                    Chào mừng quay trở lại
                </h1>

                {/* Social login */}
                <div className="space-y-3">
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
                            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
                            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                        </svg>
                        Đăng nhập bằng Google
                    </button>
                </div>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-xs text-slate-400">Hoặc đăng nhập bằng email</span>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-sm font-semibold text-slate-700">
                                Mật khẩu
                            </label>
                            <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                                Quên mật khẩu
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Bạn chưa có tài khoản?{' '}
                    <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}