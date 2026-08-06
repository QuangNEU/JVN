'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, User, Send, Heart, Building2, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
    {
        label: 'Việc làm',
        href: '/jobs',
        dropdown: [
            { label: 'Tất cả việc làm', href: '/jobs' },
            { label: 'Việc làm theo cấp độ', href: '/jobs?level=JUNIOR' },
            { label: 'Việc làm theo danh mục', href: '/jobs' },
        ],
    },
    { label: 'Tạo CV', href: '/cvs' },
];

export default function TopNavBar() {
    const { user, isAuthenticated, isLoading, logout } = useAuthStore();
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    const avatarButtonRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true); // createPortal chỉ chạy được client-side, tránh lỗi hydration mismatch
    }, []);

    const handleOpenUserMenu = () => {
        if (avatarButtonRef.current) {
            const rect = avatarButtonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom,
                left: rect.left,
            });
        }
        setUserMenuOpen(true);
    };

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600">JVN</span>
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
                                className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-gray-700 transition-colors hover:text-blue-600"
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
                                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600"
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
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-28 animate-pulse rounded-full bg-gray-200" />
                        </div>
                    ) : isAuthenticated && user ? (
                        <div
                            onMouseEnter={handleOpenUserMenu}
                            onMouseLeave={() => setUserMenuOpen(false)}
                        >
                            <button
                                ref={avatarButtonRef}
                                className="flex items-center gap-2 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 hover:border-blue-300"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                            </button>

                            {/* Portal: render thẳng vào body, thoát khỏi stacking context của header */}
                            {mounted && userMenuOpen && createPortal(
                                <div
                                    style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, paddingTop: 8 }}
                                    className="z-[100]"
                                    onMouseEnter={() => setUserMenuOpen(true)}
                                    onMouseLeave={() => setUserMenuOpen(false)}
                                >
                                    <div className="flex w-56 flex-col rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                            <User className="h-4 w-4" /> Hồ sơ cá nhân
                                        </Link>
                                        <Link href="/applications" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                            <Send className="h-4 w-4" /> Việc làm đã ứng tuyển
                                        </Link>
                                        <Link href="/jobs/saved" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                            <Heart className="h-4 w-4" /> Việc làm đã lưu
                                        </Link>
                                        <Link href="/companies/following" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                            <Building2 className="h-4 w-4" /> Công ty đang theo dõi
                                        </Link>
                                        <Link href="/cvs" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                                            <FileText className="h-4 w-4" /> Quản lý CV
                                        </Link>

                                        <hr className="my-1 mx-2 border-gray-100" />

                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4" /> Đăng xuất
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/register" className="rounded-full border border-blue-500 px-5 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50">
                                Đăng ký
                            </Link>
                            <Link href="/login" className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">
                                Đăng nhập
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}