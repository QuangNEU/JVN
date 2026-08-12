'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useBusinessCertList, useApproveBusinessCert, useRejectBusinessCert } from '../hooks/useVerification';

const statusTabs = [
    { label: 'Chờ duyệt', value: 'PENDING' },
    { label: 'Đã duyệt', value: 'APPROVED' },
    { label: 'Đã từ chối', value: 'REJECTED' },
    { label: 'Tất cả', value: undefined },
];

export default function AdminBusinessCertList() {
    const [statusFilter, setStatusFilter] = useState<string | undefined>('PENDING');
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const { data, isLoading } = useBusinessCertList(statusFilter);
    const approveMutation = useApproveBusinessCert();
    const rejectMutation = useRejectBusinessCert();

    const handleReject = async (companyId: number) => {
        if (!rejectReason.trim()) return;
        await rejectMutation.mutateAsync({ companyId, reason: rejectReason });
        setRejectingId(null);
        setRejectReason('');
    };

    return (
        <div>
            <div className="mb-5 flex gap-2">
                {statusTabs.map((tab) => (
                    <button
                        key={tab.label}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${statusFilter === tab.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-sm text-slate-400">Đang tải...</div>
            ) : !data?.results.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Không có hồ sơ nào.</div>
            ) : (
                <div className="space-y-3">
                    {data.results.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-slate-100 bg-white p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{c.company_name}</p>
                                    <p className="text-sm text-slate-500">MST: {c.tax_code || '—'}</p>
                                </div>
                                {c.document_url && (
                                    <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                                        <FileText className="h-4 w-4" /> Xem giấy tờ
                                    </a>
                                )}
                            </div>

                            {c.business_cert_status === 'PENDING' && (
                                <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                                    <button
                                        onClick={() => approveMutation.mutate(c.id)}
                                        disabled={approveMutation.isPending}
                                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Duyệt
                                    </button>
                                    <button
                                        onClick={() => setRejectingId(rejectingId === c.id ? null : c.id)}
                                        className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4" /> Từ chối
                                    </button>
                                </div>
                            )}

                            {rejectingId === c.id && (
                                <div className="mt-3 flex gap-2">
                                    <input
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Lý do từ chối..."
                                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                                    />
                                    <button
                                        onClick={() => handleReject(c.id)}
                                        disabled={rejectMutation.isPending || !rejectReason.trim()}
                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            )}

                            {c.business_cert_status === 'REJECTED' && c.business_cert_rejected_reason && (
                                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                    Lý do đã từ chối: {c.business_cert_rejected_reason}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}