import Link from 'next/link';
import Image from 'next/image';
import { User, Building2, ArrowRight } from 'lucide-react';

export default function RegisterSelectPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-10 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.15)]">
                <div className="mb-8 flex justify-center">
                    <Image src="/logo.png" alt="JVN" width={80} height={94} priority />
                </div>
                <h1 className="mb-2 text-center text-xl font-bold text-slate-800">
                    Tạo tài khoản JVN
                </h1>
                <p className="mb-8 text-center text-sm text-slate-500">
                    Chọn vai trò phù hợp với bạn để bắt đầu
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Link
                        href="/register/seeker"
                        className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-100 p-8 text-center transition-all hover:border-blue-500 hover:shadow-md"
                    >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                            <User className="h-8 w-8" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Tôi là Ứng viên</h2>
                            <p className="mt-1 text-sm text-slate-500">Tìm việc làm, tạo CV miễn phí</p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                            Bắt đầu <ArrowRight className="h-4 w-4" />
                        </span>
                    </Link>

                    <Link
                        href="/register/company"
                        className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-100 p-8 text-center transition-all hover:border-amber-500 hover:shadow-md"
                    >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                            <Building2 className="h-8 w-8" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Tôi là Nhà tuyển dụng</h2>
                            <p className="mt-1 text-sm text-slate-500">Đăng tin và tìm hồ sơ ứng viên</p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-amber-600 opacity-0 transition-opacity group-hover:opacity-100">
                            Bắt đầu <ArrowRight className="h-4 w-4" />
                        </span>
                    </Link>
                </div>

                <p className="mt-8 text-center text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}