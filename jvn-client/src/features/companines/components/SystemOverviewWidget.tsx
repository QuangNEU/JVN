'use client';

import { Building2, Users2, Briefcase, FileText } from 'lucide-react';
import { useSystemOverview } from '../hooks/useAdminDashboard';

export default function SystemOverviewWidget() {
    const { data, isLoading } = useSystemOverview();

    const stats = [
        { label: 'Tổng công ty', value: data?.total_companies, icon: Building2, color: 'bg-blue-50 text-blue-600' },
        { label: 'Tổng ứng viên', value: data?.total_seekers, icon: Users2, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Tin đang tuyển', value: data?.total_active_jobs, icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
        { label: 'Lượt ứng tuyển', value: data?.total_applications, icon: FileText, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
            {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                        <s.icon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-2xl font-bold text-slate-800">
                        {isLoading ? '...' : s.value ?? 0}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                </div>
            ))}
        </div>
    );
}