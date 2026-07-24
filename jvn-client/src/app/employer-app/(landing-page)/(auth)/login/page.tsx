'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '@/features/accounts/services/accountService';
import { useAuthStore } from '@/store/useAuthStore';
import { getRedirectByRole } from '@/utils/getRedirectPathByRole';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '@/features/accounts/services/accountService';
export default function EmployerLoginPage() {
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
                    Đăng nhập Nhà tuyển dụng
                </h1>
                <p className="mb-7 text-center text-sm text-slate-500">
                    Quản lý tin tuyển dụng và tìm kiếm ứng viên
                </p>

                {/* Social login */}
                <div className="space-y-3 mb-7">
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


                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email" required value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                            <Link href="/forgot-password" className="text-sm font-medium text-amber-600 hover:underline">
                                Quên mật khẩu
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'} required value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
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
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-60"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Chưa có tài khoản?{' '}
                    <Link href="/register" className="font-semibold text-amber-600 hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
        </div>
    );
}