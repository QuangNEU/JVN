'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListChecks, FileCheck2 } from 'lucide-react';

const navItems = [
    { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Duyệt danh mục', href: '/categories', icon: ListChecks },
    { label: 'Duyệt giấy chứng nhận', href: '/business-certs', icon: FileCheck2 },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 border-r border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-sm font-bold text-slate-800">JVN Admin</p>
            </div>
            <nav className="space-y-1 p-4">
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
        </aside>
    );
}