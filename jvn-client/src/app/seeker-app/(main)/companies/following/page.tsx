'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyFollows } from '@/features/follow/hooks/useMyFollow';

export default function FollowingCompaniesPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useMyFollows(page);

    return (
        <div className="bg-slate-50 pb-16">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <h1 className="text-xl font-bold text-slate-800">Công ty đang theo dõi</h1>
                <p className="mt-1 text-sm text-slate-500">Danh sách công ty bạn đang theo dõi để cập nhật tin tuyển dụng mới.</p>

                <div className="mt-5 space-y-3">
                    {isLoading ? (
                        <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-400">Đang tải...</div>
                    ) : isError ? (
                        <div className="rounded-2xl border border-dashed border-red-200 bg-white py-12 text-center text-sm text-red-500">
                            Không tải được danh sách.
                        </div>
                    ) : !data || data.results.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                            <Building2 className="h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-500">Bạn chưa theo dõi công ty nào.</p>
                        </div>
                    ) : (
                        data.results.map((follow) => (
                            <Link
                                key={follow.id}
                                href={`/jobs?keyword=${encodeURIComponent(follow.company.name)}`}
                                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-md"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                                    {follow.company.logo ? (
                                        <img src={follow.company.logo} alt={follow.company.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-5 w-5 text-blue-500" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-800">{follow.company.name}</p>
                                    <p className="truncate text-xs text-slate-500">{follow.company.industry || 'Chưa cập nhật lĩnh vực'}</p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {data && (data.next || data.previous) && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.previous} className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
                            <ChevronLeft className="h-4 w-4" /> Trước
                        </button>
                        <span className="text-sm text-slate-500">Trang {page}</span>
                        <button onClick={() => setPage((p) => p + 1)} disabled={!data.next} className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
                            Sau <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}