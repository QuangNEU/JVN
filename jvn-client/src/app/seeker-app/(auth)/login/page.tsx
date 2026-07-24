// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { googleLogin, login } from '@/features/accounts/services/accountService';
import { getRedirectByRole } from '@/utils/getRedirectPathByRole';
import { GoogleLogin } from '@react-oauth/google';

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
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (!credentialResponse.credential) {
                                setError('Cant take credential');
                                return;
                            }
                            setError('');
                            setLoading(true);
                            try {
                                const hostname = window.location.hostname;
                                const currentRole = hostname.startsWith('tuyendung') ? 'COMPANY' : 'SEEKER';
                                const data = await googleLogin({
                                    google_token: credentialResponse.credential,
                                    role: currentRole
                                });

                                setAuth(data.user);
                                router.push(getRedirectByRole(data.user.role));
                            } catch (err: any) {
                                setError(err.response?.data?.message || 'Google Login failed. Please try again');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        onError={() => {
                            setError('You have cancel the login');
                        }}
                        size="large"
                        theme="outline"
                        width="400"
                        shape="pill"
                    />
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
        </div >
    );
}