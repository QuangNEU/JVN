'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, Users, Building2, LogOut, Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';

const navItems = [
    { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tin tuyển dụng', href: '/jobs', icon: Briefcase },
    { label: 'Ứng viên', href: '/applicants', icon: Users },
    { label: 'Hồ sơ công ty', href: '/profile', icon: Building2 },
];

export default function CompanySidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-slate-100 bg-white">
            <div className="flex items-center gap-2 px-6 py-5">
                <Image src="/logo.png" alt="JVN" width={32} height={38} />
                <span className="text-base font-bold text-slate-800">
                    JVN <span className="font-normal text-slate-400">Business</span>
                </span>
            </div>

            <div className="px-4 pb-4">
                <Link
                    href="/jobs/new"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600"
                >
                    <Plus className="h-4 w-4" /> Đăng tin mới
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            <item.icon className="h-[18px] w-[18px]" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-100 p-4">
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                        {user?.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
                        <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                    <LogOut className="h-[18px] w-[18px]" /> Đăng xuất
                </button>
            </div>
        </aside>
    );
}