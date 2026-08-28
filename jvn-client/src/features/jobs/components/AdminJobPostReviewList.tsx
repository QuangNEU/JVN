'use client';

import { useState } from 'react';
import { useAdminJobPostReview, useApproveJobPost, useRejectJobPost } from '../hooks/useAdminJobPostReview';
import { JOB_STATUS, JobStatusType, JobPost } from '../types/jobs';

const TABS: { label: string; value: JobStatusType }[] = [
    { label: 'Chờ duyệt', value: JOB_STATUS.PENDING },
    { label: 'Đang mở', value: JOB_STATUS.PUBLISH },
    { label: 'Đã từ chối', value: JOB_STATUS.REJECTED },
    { label: 'Đã đóng', value: JOB_STATUS.CLOSED },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    [JOB_STATUS.PENDING]: { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    [JOB_STATUS.PUBLISH]: { label: 'Đang mở', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    [JOB_STATUS.REJECTED]: { label: 'Đã từ chối', className: 'bg-red-50 text-red-700 border-red-200' },
    [JOB_STATUS.CLOSED]: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function AdminJobPostReviewList() {
    const [activeTab, setActiveTab] = useState<JobStatusType>(JOB_STATUS.PENDING);
    const [rejectTarget, setRejectTarget] = useState<JobPost | null>(null);
    const [detailTarget, setDetailTarget] = useState<JobPost | null>(null);
    const [reason, setReason] = useState('');

    const { data, isLoading } = useAdminJobPostReview({ status: activeTab, page_size: 20 });
    const approveMutation = useApproveJobPost();
    const rejectMutation = useRejectJobPost();

    const handleApprove = (id: number) => approveMutation.mutate(id);

    const handleRejectSubmit = () => {
        if (!rejectTarget || !reason.trim()) return;
        rejectMutation.mutate(
            { jobPostId: rejectTarget.id, reason },
            { onSuccess: () => { setRejectTarget(null); setReason(''); } }
        );
    };

    return (
        <div className="p-6 max-w-5xl">
            <h1 className="text-xl font-semibold text-slate-900">Duyệt tin tuyển dụng</h1>
            <p className="text-sm text-slate-500 mt-1">Xem xét và phê duyệt tin đăng từ nhà tuyển dụng.</p>

            <div className="flex gap-2 mt-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === tab.value
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading && <div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>}

            {!isLoading && data?.results.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">Không có tin nào ở trạng thái này.</div>
            )}

            <div className="mt-4 space-y-3">
                {data?.results.map((job) => {
                    const badge = STATUS_BADGE[job.status] ?? { label: job.status, className: 'bg-slate-100 text-slate-500 border-slate-200' };
                    return (
                        <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-medium text-slate-900 truncate">{job.title}</h3>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                        <span className="text-xs text-slate-400 shrink-0">#{job.id}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{job.company_name}</p>
                                    <p className="text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">{job.descriptions}</p>

                                    {job.status === JOB_STATUS.REJECTED && job.rejected_reason && (
                                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                            <span className="font-medium">Lý do từ chối: </span>{job.rejected_reason}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setDetailTarget(job)}
                                        className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 mt-2"
                                    >
                                        Xem đầy đủ
                                    </button>
                                </div>

                                {job.status === JOB_STATUS.PENDING && (
                                    <div className="flex flex-col gap-2 shrink-0 w-28">
                                        <button
                                            onClick={() => handleApprove(job.id)}
                                            disabled={approveMutation.isPending}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => setRejectTarget(job)}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {detailTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-lg text-slate-900">{detailTarget.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{detailTarget.company_name}</p>
                            </div>
                            <button onClick={() => setDetailTarget(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mt-4 space-y-4 text-sm text-slate-700">
                            <section>
                                <h4 className="font-medium text-slate-900 mb-1">Mô tả công việc</h4>
                                <p className="whitespace-pre-line leading-relaxed">{detailTarget.descriptions}</p>
                            </section>
                            <section>
                                <h4 className="font-medium text-slate-900 mb-1">Yêu cầu</h4>
                                <p className="whitespace-pre-line leading-relaxed">{detailTarget.requirement}</p>
                            </section>
                            {detailTarget.benefit && (
                                <section>
                                    <h4 className="font-medium text-slate-900 mb-1">Quyền lợi</h4>
                                    <p className="whitespace-pre-line leading-relaxed">{detailTarget.benefit}</p>
                                </section>
                            )}
                        </div>

                        {detailTarget.status === JOB_STATUS.PENDING && (
                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => { setRejectTarget(detailTarget); setDetailTarget(null); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => { handleApprove(detailTarget.id); setDetailTarget(null); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    Duyệt
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {rejectTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-medium text-slate-900">Từ chối tin đăng</h3>
                        <p className="text-sm text-slate-500 mt-1 truncate">{rejectTarget.title}</p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do từ chối..."
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm mt-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setRejectTarget(null); setReason(''); }}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!reason.trim() || rejectMutation.isPending}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}