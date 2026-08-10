'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { register } from '@/features/accounts/services/accountService';
import { useAuthStore } from '@/store/useAuthStore';
import { getRedirectByRole } from '@/utils/getRedirectPathByRole';
import { Role } from '@/features/accounts/types/account';
import { ProvinceWardValue } from '@/features/locations/types/vnLocations';
import ProvinceWardSelect from '@/features/locations/components/ProvinceWardSelect';

export default function RegisterCompanyPage() {
    const [form, setForm] = useState({ email: '', password: '', name: '', tel: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [location, setLocation] = useState<ProvinceWardValue>({});
    const router = useRouter()
    const setAuth = useAuthStore((state) => state.setAuth)

    const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const data = await register({
                ...form, province: location.provinceName,
                ward: location.wardName, role: Role.COMPANY
            })
            setAuth(data.user)
            router.push(getRedirectByRole(data.user.role))
        } catch (err: any) {
            setError(err.response?.data?.error || 'Register failed. Please try again')
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-[520px] rounded-2xl border border-slate-100 bg-white p-10 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)]">
                <Link href="/register" className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="h-4 w-4" /> Quay lại
                </Link>

                <div className="mb-4 flex justify-center">
                    <Image src="/logo.png" alt="JVN" width={72} height={84} />
                </div>
                <h1 className="mb-1 text-center text-xl font-bold text-slate-800">
                    Đăng ký tài khoản Nhà tuyển dụng
                </h1>
                <p className="mb-7 text-center text-sm text-slate-500">
                    Đăng tin tuyển dụng và tìm kiếm ứng viên phù hợp
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên công ty</label>
                        <input
                            type="text" required value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="Công ty TNHH ABC"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                        <input
                            type="email" required value={form.email}
                            onChange={(e) => update('email', e.target.value)}
                            placeholder="Email công ty"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'} required value={form.password}
                                onChange={(e) => update('password', e.target.value)}
                                placeholder="Tối thiểu 8 ký tự"
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
                            />
                            <button type="button" onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số điện thoại</label>
                        <input
                            type="tel" required value={form.tel}
                            onChange={(e) => update('tel', e.target.value)}
                            placeholder="0912345678"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-500"
                        />
                    </div>

                    <ProvinceWardSelect value={location} onChange={setLocation} accentClassName="border-orange-500" />


                    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                    <button
                        type="submit" disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-60"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}