'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListChecks, FileCheck2, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
    { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Duyệt danh mục', href: '/categories', icon: ListChecks },
    { label: 'Duyệt giấy chứng nhận', href: '/business-certs', icon: FileCheck2 },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-sm font-bold text-slate-800">JVN Admin</p>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <item.icon className="h-[18px] w-[18px]" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-100 p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                    <LogOut className="h-5 w-5" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}