'use client';

import { useState } from 'react';
import { useAdminReports, useResolveReport, useDismissReport } from '../hooks/useAdminReports';
import { ReportStatusType, REPORT_STATUS, REPORT_TARGET_TYPE, Report } from '../types/report';
import { useLockAccount, useUnlockAccount } from '@/features/accounts/hooks/useAccountLock';
import { Role } from '@/features/accounts/types/account';
import { useQueryClient } from '@tanstack/react-query';

const TABS: { label: string; value: ReportStatusType }[] = [
    { label: 'Chờ xử lý', value: REPORT_STATUS.PENDING },
    { label: 'Đã xử lý', value: REPORT_STATUS.RESOLVED },
    { label: 'Đã bỏ qua', value: REPORT_STATUS.DISMISSED },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    [REPORT_STATUS.PENDING]: { label: 'Chờ xử lý', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    [REPORT_STATUS.RESOLVED]: { label: 'Đã xử lý', className: 'bg-red-50 text-red-700 border-red-200' },
    [REPORT_STATUS.DISMISSED]: { label: 'Đã bỏ qua', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function AdminReportReviewList() {
    const [activeTab, setActiveTab] = useState<ReportStatusType>(REPORT_STATUS.PENDING);
    const [dismissTarget, setDismissTarget] = useState<Report | null>(null);
    const [detailTarget, setDetailTarget] = useState<Report | null>(null);
    const [note, setNote] = useState('');
    const [lockTarget, setLockTarget] = useState<Report | null>(null);
    const [lockReason, setLockReason] = useState('');
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useAdminReports({ status: activeTab, page_size: 20 });
    const resolveMutation = useResolveReport();
    const dismissMutation = useDismissReport();
    const lockMutation = useLockAccount();
    const unlockMutation = useUnlockAccount();

    const handleResolve = (report: Report) => {
        resolveMutation.mutate(
            { reportId: report.id },
            {
                onSuccess: () => {
                    // Tự động mở modal hỏi khóa ngay sau khi xác nhận vi phạm,
                    // trừ khi tài khoản đã bị khóa từ trước
                    if (!report.target_account_is_locked) {
                        setLockTarget(report);
                    }
                },
            }
        );
    };

    const handleDismissSubmit = () => {
        if (!dismissTarget || !note.trim()) return;
        dismissMutation.mutate(
            { reportId: dismissTarget.id, admin_note: note },
            { onSuccess: () => { setDismissTarget(null); setNote(''); } }
        );
    };

    const handleLockSubmit = () => {
        if (!lockTarget?.target_account_id || !lockReason.trim()) return;
        lockMutation.mutate(
            { account: { id: lockTarget.target_account_id, role: Role.COMPANY } as any, reason: lockReason },
            {
                onSuccess: () => {
                    setLockTarget(null);
                    setLockReason('');
                    refetch();
                }
            }
        );
    };

    const handleUnlock = (report: Report) => {
        if (!report.target_account_id) return;
        unlockMutation.mutate({ id: report.target_account_id, role: Role.COMPANY } as any, {
            onSuccess: () => {
                refetch()
            }
        });
    };

    return (
        <div className="p-6 max-w-5xl">
            <h1 className="text-xl font-semibold text-slate-900">Xử lý báo cáo</h1>
            <p className="text-sm text-slate-500 mt-1">Xem xét các báo cáo vi phạm từ ứng viên.</p>

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
                <div className="py-16 text-center text-sm text-slate-400">Không có báo cáo nào ở trạng thái này.</div>
            )}

            <div className="mt-4 space-y-3">
                {data?.results.map((report) => {
                    const badge = STATUS_BADGE[report.status] ?? { label: report.status, className: 'bg-slate-100 text-slate-500 border-slate-200' };
                    const targetLabel = report.target_type === REPORT_TARGET_TYPE.JOB_POST ? 'Tin tuyển dụng' : 'Công ty';
                    const targetName = report.target_type === REPORT_TARGET_TYPE.JOB_POST ? report.job_post_title : report.company_name;

                    return (
                        <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                            {targetLabel}
                                        </span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${badge.className}`}>
                                            {badge.label}
                                        </span>
                                        <span className="text-xs text-slate-400 shrink-0">#{report.id}</span>
                                        {report.target_account_is_locked && (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 shrink-0">
                                                Tài khoản đã khóa
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-medium text-slate-900 mt-2 truncate">{targetName}</h3>
                                    {report.target_type === REPORT_TARGET_TYPE.JOB_POST && report.target_company_name && (
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Công ty: <span className="font-medium text-slate-700">{report.target_company_name}</span>
                                        </p>
                                    )}
                                    <p className="text-sm text-slate-500 mt-1">Người báo cáo: {report.reporter_email}</p>

                                    {report.status !== REPORT_STATUS.PENDING && report.admin_note && (
                                        <div className="mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                            <span className="font-medium">Ghi chú admin: </span>{report.admin_note}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            onClick={() => setDetailTarget(report)}
                                            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
                                        >
                                            Xem đầy đủ
                                        </button>

                                        {report.target_account_id && (
                                            report.target_account_is_locked ? (
                                                <button
                                                    onClick={() => handleUnlock(report)}
                                                    disabled={unlockMutation.isPending}
                                                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                                                >
                                                    Mở khóa tài khoản
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setLockTarget(report)}
                                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                                                >
                                                    Khóa tài khoản
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {report.status === REPORT_STATUS.PENDING && (
                                    <div className="flex flex-col gap-2 shrink-0 w-32">
                                        <button
                                            onClick={() => handleResolve(report)}
                                            disabled={resolveMutation.isPending}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            Xác nhận vi phạm
                                        </button>
                                        <button
                                            onClick={() => setDismissTarget(report)}
                                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Bỏ qua
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
                                <h3 className="font-semibold text-lg text-slate-900">
                                    {detailTarget.target_type === REPORT_TARGET_TYPE.JOB_POST
                                        ? detailTarget.job_post_title
                                        : detailTarget.company_name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Người báo cáo: {detailTarget.reporter_email} · #{detailTarget.id}
                                </p>
                            </div>
                            <button onClick={() => setDetailTarget(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mt-4 space-y-4 text-sm text-slate-700">
                            <section>
                                <h4 className="font-medium text-slate-900 mb-1">Nội dung báo cáo</h4>
                                <p className="whitespace-pre-line leading-relaxed">{detailTarget.reason}</p>
                            </section>
                            {detailTarget.admin_note && (
                                <section>
                                    <h4 className="font-medium text-slate-900 mb-1">Ghi chú admin</h4>
                                    <p className="whitespace-pre-line leading-relaxed">{detailTarget.admin_note}</p>
                                </section>
                            )}
                        </div>

                        {detailTarget.status === REPORT_STATUS.PENDING && (
                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => { setDismissTarget(detailTarget); setDetailTarget(null); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Bỏ qua
                                </button>
                                <button
                                    onClick={() => { handleResolve(detailTarget); setDetailTarget(null); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700"
                                >
                                    Xác nhận vi phạm
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {dismissTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-medium text-slate-900">Bỏ qua báo cáo #{dismissTarget.id}</h3>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập lý do bỏ qua (bắt buộc)..."
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm mt-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setDismissTarget(null); setNote(''); }}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDismissSubmit}
                                disabled={!note.trim() || dismissMutation.isPending}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white disabled:opacity-50"
                            >
                                Xác nhận bỏ qua
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lockTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="font-medium text-slate-900">Khóa tài khoản liên quan</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Báo cáo #{lockTarget.id} — {lockTarget.company_name ?? lockTarget.job_post_title}
                        </p>
                        <textarea
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="Nhập lý do khóa..."
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm mt-4 min-h-[80px]"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setLockTarget(null); setLockReason(''); }}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600"
                            >
                                Bỏ qua
                            </button>
                            <button
                                onClick={handleLockSubmit}
                                disabled={!lockReason.trim() || lockMutation.isPending}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50"
                            >
                                Khóa tài khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}