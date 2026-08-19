'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const isLoading = useAuthStore((s) => s.isLoading);
    const restoreSession = useAuthStore((s) => s.restoreSession);

    useEffect(() => {
        restoreSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {

        if (!isLoading && (!user || user.role !== 'ADMIN')) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading || !user || user.role !== 'ADMIN') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-sm text-slate-400">Đang kiểm tra quyền truy cập...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <AdminSidebar />
            <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
    );
}