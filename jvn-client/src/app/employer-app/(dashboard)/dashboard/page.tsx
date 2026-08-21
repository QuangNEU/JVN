'use client';

import { Briefcase, Users, Eye, Sparkles } from 'lucide-react';
import { useCompanyDashboardSummary } from '@/features/companines/hooks/useCompanies';
import JobsPendingReviewWidget from '@/features/companines/components/JobsPendingReviewWidget';
import ExpiringJobsWidget from '@/features/jobs/components/ExpiringJobsWidget';
import ApplicationStatusBreakdownWidget from '@/features/companines/components/ApplicationStatusBreakdownWidget';

export default function DashboardPage() {
    const { data, isLoading } = useCompanyDashboardSummary();

    const stats = [
        { label: 'Tin đang tuyển', value: data?.active_job_count ?? '—', icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
        { label: 'Tổng ứng viên', value: data?.total_applications ?? '—', icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Lượt xem tin', value: data?.total_views?.toLocaleString('vi-VN') ?? '—', icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
    ];

    return (
        <div>
            <h1 className="mb-1 text-2xl font-bold text-slate-800">Tổng quan</h1>
            <p className="mb-6 text-sm text-slate-500">Chào mừng quay trở lại!</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                            <s.icon className="h-5 w-5" />
                        </span>
                        <p className="mt-4 text-2xl font-bold text-slate-800">
                            {isLoading ? '...' : s.value}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                    </div>
                ))}

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                        <Sparkles className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-slate-600">Sắp ra mắt</p>
                    <p className="mt-1 text-sm text-slate-400">Tỷ lệ phù hợp (AI)</p>
                </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <JobsPendingReviewWidget />
                <ExpiringJobsWidget />
            </div>
            <div className="mt-5">
                <ApplicationStatusBreakdownWidget />
            </div>
        </div>
    );
}