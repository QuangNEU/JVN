'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Bell, Plus, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';

export default function CompanyTopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
    const { user, logout } = useAuthStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient()
    const handleLogout = async () => {
        try {
            await logout();
        }
        finally {
            queryClient.clear();
            router.push('/');
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-slate-900 px-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="JVN" width={32} height={38} />
                    <span className="text-base font-bold text-white">
                        JVN <span className="font-normal text-slate-400">Business</span>
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-2">

                <button className="relative rounded-full p-2.5 text-slate-300 hover:bg-slate-800">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-800"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-100 bg-white py-2 shadow-lg">
                            <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                                <User className="h-4 w-4" /> Hồ sơ công ty
                            </Link>
                            <hr className="my-1 border-slate-100" />
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                            >
                                <LogOut className="h-4 w-4" /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}