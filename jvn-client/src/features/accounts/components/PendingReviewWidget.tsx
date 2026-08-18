// components/PendingReviewWidget.tsx
'use client';

import Link from 'next/link';
import { ListChecks, FileCheck2 } from 'lucide-react';
import { usePendingBusinessCertCount, usePendingCategoryCount } from '../hooks/useVerification';

export default function PendingReviewWidget() {
    const { data: categoryCount, isLoading: loadingCategory } = usePendingCategoryCount();
    const { data: certCount, isLoading: loadingCert } = usePendingBusinessCertCount();

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Link
                href="/categories"
                className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-slate-300"
            >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <ListChecks className="h-5 w-5" />
                </span>
                <p className="mt-4 text-2xl font-bold text-slate-800">
                    {loadingCategory ? '...' : categoryCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-slate-500">Danh mục đang chờ duyệt</p>
            </Link>

            <Link
                href="/business-certs"
                className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-slate-300"
            >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileCheck2 className="h-5 w-5" />
                </span>
                <p className="mt-4 text-2xl font-bold text-slate-800">
                    {loadingCert ? '...' : certCount ?? 0}
                </p>
                <p className="mt-1 text-sm text-slate-500">Giấy chứng nhận đang chờ duyệt</p>
            </Link>
        </div>
    );
}