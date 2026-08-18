// features/jobs/components/ExpiringJobsWidget.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useExpiringJobs } from '../hooks/useCompanyJobs';

function daysLeft(dateStr: string) {
    const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ExpiringJobsWidget() {
    const { data, isLoading } = useExpiringJobs();

    if (isLoading) return null;
    if (!data || data.length === 0) return null; // không có tin sắp hết hạn thì ẩn hẳn, khỏi chiếm chỗ vô ích

    return (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Tin sắp hết hạn</p>
            </div>
            <ul className="space-y-2">
                {data.map((job) => (
                    <li key={job.id} className="flex items-center justify-between text-sm">
                        <Link href={`/jobs/${job.id}`} className="text-slate-700 hover:underline">
                            {job.title}
                        </Link>
                        <span className="text-amber-700">
                            Còn {daysLeft(job.expiration_date)} ngày
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}