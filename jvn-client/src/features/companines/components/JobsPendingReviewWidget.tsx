'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { useJobsPendingReview } from '../hooks/useCompanies';

export default function JobsPendingReviewWidget() {
    const { data, isLoading } = useJobsPendingReview();

    if (isLoading) return null;
    if (!data || data.length === 0) return null;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-slate-800">Ứng viên đang chờ duyệt</p>
            </div>
            <ul className="space-y-2">
                {data.map((job) => (
                    <li key={job.id} className="flex items-center justify-between text-sm">
                        <Link href={`/jobs/${job.id}`} className="text-slate-700 hover:underline">
                            {job.title}
                        </Link>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                            {job.pending_count} ứng viên
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}