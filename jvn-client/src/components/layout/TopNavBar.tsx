'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, Briefcase, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Role } from '@/features/accounts/types/account';

const navItems = [
    {
        label: 'Việc làm',
        href: '/jobs',
        dropdown: [
            { label: 'Tất cả việc làm', href: '/jobs' },
            { label: 'Việc làm theo cấp độ', href: '/jobs?level=junior' },
            { label: 'Việc làm theo danh mục', href: '/jobs?category=all' },
        ],
    },
    { label: 'Tạo CV', href: '/cvs' },
];

export default function TopNavBar() {
    const { user, isAuthenticated, isLoading, logout } = useAuthStore();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-emerald-600">JVN</span>
                </Link>

                {/* Nav items */}
                <nav className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => (
                        <div
                            key={item.label}
                            className="relative"
                            onMouseEnter={() => item.dropdown && setOpenDropdown(item.label)}
                            onMouseLeave={() => item.dropdown && setOpenDropdown(null)}
                        >
                            <Link
                                href={item.href}
                                className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-gray-700 transition-colors hover:text-emerald-600"
                            >
                                {item.label}
                                {item.dropdown && <ChevronDown className="h-4 w-4" />}
                            </Link>

                            {item.dropdown && openDropdown === item.label && (
                                <div className="absolute left-0 top-full w-56 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                                    {item.dropdown.map((sub) => (
                                        <Link
                                            key={sub.label}
                                            href={sub.href}
                                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                                        >
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Auth area */}
                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <div className="h-9 w-24 animate-pulse rounded-full bg-gray-100" />
                    ) : isAuthenticated && user ? (
                        <div
                            className="relative"
                            onMouseEnter={() => setUserMenuOpen(true)}
                            onMouseLeave={() => setUserMenuOpen(false)}
                        >
                            <button className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 hover:border-emerald-300">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 top-full w-52 rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                                    {user.role === Role.SEEKER ? (
                                        <>
                                            <Link
                                                href="/register/seeker"
                                                className="rounded-full border border-blue-500 px-5 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                                            >
                                                Đăng ký
                                            </Link>
                                            <Link
                                                href="/login"
                                                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                                            >
                                                Đăng nhập
                                            </Link>
                                            <Link
                                                href="/register/company"
                                                className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                            >
                                                Đăng tuyển &amp; tìm hồ sơ
                                            </Link>
                                        </>
                                    ) : (
                                        <Link href="/company/jobs" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                            <Briefcase className="h-4 w-4" /> Quản lý tin tuyển dụng
                                        </Link>
                                    )}
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/register"
                                className="rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
                            >
                                Đăng ký
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
                            >
                                Đăng nhập
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}