import Link from 'next/link';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import logo from '../../../../public/logo.png'

const navItems = [
    { label: 'Giới thiệu', href: '/about' },
    { label: 'Dịch vụ', href: '/services' },
    { label: 'Báo giá', href: '/pricing' },
    { label: 'Hỗ trợ', href: '/support' },
];

export default function EmployerLandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="JVN" width={40} height={47} />
                        <span className="text-lg font-bold text-slate-800">
                            JVN <span className="font-normal text-slate-400">for Business</span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-[15px] font-medium text-slate-600 transition-colors hover:text-amber-600"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <a
                            href="tel:1900068889"
                            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 lg:flex">

                            <Phone className="h-4 w-4 text-amber-500" /> Tư vấn tuyển dụng
                        </a>
                        <Link
                            href="/login"
                            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            href="/register"
                            className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
                        >
                            Đăng tin ngay
                        </Link>
                    </div>
                </div>
            </header >

            <main className="flex-1">{children}</main>

            <footer className="border-t border-slate-100 bg-slate-50 py-8">
                <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-400">
                    © {new Date().getFullYear()} JVN for Business. Bảo lưu mọi quyền.
                </div>
            </footer>
        </div >
    );
}