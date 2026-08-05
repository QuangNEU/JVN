'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useUpdateApplicationStatus } from '@/features/applications/hooks/useUpdateApplicationStatus';
import { ApplicationStatus, CompanyApplication } from '@/features/applications/types/application';
import { STATUS_LABELS } from '@/constants/application';

const STATUS_OPTIONS: ApplicationStatus[] = [
    'SENT', 'RECEIVED', 'WATCHED', 'SUITABLE', 'INTERVIEWING', 'HIRED', 'REJECTED',
];

interface UpdateStatusModalProps {
    jobId: number;
    application: CompanyApplication;
    isOpen: boolean;
    onClose: () => void;
}

export default function UpdateStatusModal({ jobId, application, isOpen, onClose }: UpdateStatusModalProps) {
    const [status, setStatus] = useState<ApplicationStatus>(application.status);
    const [interviewDate, setInterviewDate] = useState(
        application.interview_date ? application.interview_date.slice(0, 16) : ''
    );
    const [rejectedReason, setRejectedReason] = useState(application.rejected_reason || '');

    const updateStatus = useUpdateApplicationStatus(jobId);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (updateStatus.isPending) return; // chặn double-submit

        updateStatus.mutate(
            {
                applicationId: application.id,
                payload: {
                    status,
                    interview_date: status === 'INTERVIEWING' ? new Date(interviewDate).toISOString() : undefined,
                    rejected_reason: status === 'REJECTED' ? rejectedReason : undefined,
                },
            },
            { onSuccess: onClose }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                </button>

                <form onSubmit={handleSubmit}>
                    <h3 className="text-base font-bold text-slate-800">Cập nhật trạng thái</h3>
                    <p className="mt-1 truncate text-sm text-slate-500">{application.applicant_name}</p>

                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    {status === 'INTERVIEWING' && (
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Thời gian phỏng vấn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                                required
                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                            />
                        </div>
                    )}

                    {status === 'REJECTED' && (
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Lý do từ chối (không bắt buộc)
                            </label>
                            <textarea
                                value={rejectedReason}
                                onChange={(e) => setRejectedReason(e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-amber-400"
                            />
                        </div>
                    )}

                    {updateStatus.isError && (
                        <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                            {updateStatus.error instanceof Error ? updateStatus.error.message : 'Có lỗi xảy ra.'}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={updateStatus.isPending || (status === 'INTERVIEWING' && !interviewDate)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Xác nhận
                    </button>
                </form>
            </div>
        </div>
    );
}