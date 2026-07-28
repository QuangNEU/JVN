'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Users, Building2 } from 'lucide-react';

const navItems = [
    { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tin tuyển dụng', href: '/jobs', icon: Briefcase },
    { label: 'Ứng viên', href: '/applicants', icon: Users },
    { label: 'Hồ sơ công ty', href: '/profile', icon: Building2 },
];

export default function CompanySidebar({
    isOpen, onClose,
}: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />
            )}

            <aside
                className={`fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-slate-100 bg-white transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
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
            </aside>
        </>
    );
}