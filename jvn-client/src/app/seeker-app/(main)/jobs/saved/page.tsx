'use client';

import { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMySavedJobs } from '@/features/jobs/hooks/useMySavedJob';
import JobListCard from '@/components/ui/JobListCard';

export default function SavedJobsPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, isError } = useMySavedJobs(page);

    return (
        <div className="bg-slate-50 pb-16">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <h1 className="text-xl font-bold text-slate-800">Việc làm đã lưu</h1>
                <p className="mt-1 text-sm text-slate-500">Danh sách tin tuyển dụng bạn đã đánh dấu để xem lại.</p>

                <div className="mt-5 space-y-3">
                    {isLoading ? (
                        <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-400">Đang tải...</div>
                    ) : isError ? (
                        <div className="rounded-2xl border border-dashed border-red-200 bg-white py-12 text-center text-sm text-red-500">
                            Không tải được danh sách.
                        </div>
                    ) : !data || data.results.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                            <Heart className="h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-500">Bạn chưa lưu tin tuyển dụng nào.</p>
                        </div>
                    ) : (
                        data.results.map((saved) => <JobListCard key={saved.id} job={saved.job_post} />)
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