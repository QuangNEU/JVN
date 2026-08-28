// features/companines/components/PendingReviewWidget.tsx
'use client';

import { ListChecks, FileCheck2, Briefcase, Flag } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminJobPostReview } from '@/features/jobs/hooks/useAdminJobPostReview';
import { useAdminReports } from '@/features/reports/hooks/useAdminReports';
// import hook đếm category/cert hiện có của em ở đây

export default function PendingReviewWidget() {
    const { user } = useAuthStore();

    // 2 query cũ (category, cert) — giữ nguyên logic hiện tại của em, ví dụ:
    // const { data: categoryData } = usePendingCategoryCount();
    // const { data: certData } = usePendingCertCount();

    const { data: jobData } = useAdminJobPostReview({ status: 'PENDING', page_size: 1 });
    const { data: reportData } = useAdminReports({ status: 'PENDING', page_size: 1 });

    const cards = [
        {
            icon: ListChecks,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            count: 0, // thay bằng categoryData?.count ?? 0
            label: 'Danh mục đang chờ duyệt',
        },
        {
            icon: FileCheck2,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            count: 0, // thay bằng certData?.count ?? 0
            label: 'Giấy chứng nhận đang chờ duyệt',
        },
        {
            icon: Briefcase,
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-500',
            count: jobData?.count ?? 0,
            label: 'Tin tuyển dụng đang chờ duyệt',
            href: '/job-posts',
        },
        {
            icon: Flag,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            count: reportData?.count ?? 0,
            label: 'Báo cáo đang chờ xử lý',
            href: '/reports',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, i) => (
                <a
                    key={i}
                    href={card.href ?? '#'}
                    className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-slate-200 transition-colors"
                >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                        <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <p className="text-3xl font-bold text-slate-900 mt-4">{card.count}</p>
                    <p className="text-sm text-slate-500 mt-1">{card.label}</p>
                </a>
            ))}
        </div>
    );
}