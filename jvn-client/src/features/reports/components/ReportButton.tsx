'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useCreateReport } from '../hooks/useCreateReport';
import { REPORT_TARGET_TYPE, ReportTargetType } from '../types/report';

const REASON_PRESETS = [
    'Nội dung lừa đảo, việc nhẹ lương cao',
    'Yêu cầu chuyển khoản / đóng phí trước',
    'Thông tin sai sự thật',
    'Spam, đăng trùng lặp nhiều lần',
    'Khác',
];

interface ReportButtonProps {
    targetType: ReportTargetType;
    targetId: number;
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
    const [open, setOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const { mutate, isPending, error } = useCreateReport();

    const finalReason = selectedReason === 'Khác' ? customReason : selectedReason;

    const handleSubmit = () => {
        if (!finalReason.trim()) return;
        mutate(
            { target_type: targetType, target_id: targetId, reason: finalReason },
            { onSuccess: () => setSubmitted(true) }
        );
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedReason('');
        setCustomReason('');
        setSubmitted(false);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
                <Flag className="w-4 h-4" />
                Báo cáo {targetType === REPORT_TARGET_TYPE.JOB_POST ? 'tin đăng' : 'công ty'}
            </button>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        {submitted ? (
                            <div className="text-center py-4">
                                <p className="font-medium text-slate-900">Đã gửi báo cáo</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Cảm ơn bạn đã phản ánh. Đội ngũ quản trị sẽ xem xét sớm.
                                </p>
                                <button
                                    onClick={handleClose}
                                    className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white"
                                >
                                    Đóng
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="font-medium text-slate-900">
                                    Báo cáo {targetType === REPORT_TARGET_TYPE.JOB_POST ? 'tin tuyển dụng' : 'công ty'}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Cho chúng tôi biết vấn đề bạn gặp phải.
                                </p>

                                <div className="mt-4 space-y-2">
                                    {REASON_PRESETS.map((reason) => (
                                        <label
                                            key={reason}
                                            className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                                        >
                                            <input
                                                type="radio"
                                                name="report-reason"
                                                checked={selectedReason === reason}
                                                onChange={() => setSelectedReason(reason)}
                                            />
                                            {reason}
                                        </label>
                                    ))}
                                </div>

                                {selectedReason === 'Khác' && (
                                    <textarea
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Mô tả chi tiết vấn đề..."
                                        className="w-full border border-slate-200 rounded-lg p-3 text-sm mt-3 min-h-[80px]"
                                    />
                                )}

                                {error && (
                                    <p className="text-sm text-red-600 mt-2">
                                        {(error as any)?.response?.data?.error || 'Gửi báo cáo thất bại, thử lại sau.'}
                                    </p>
                                )}

                                <div className="flex justify-end gap-2 mt-5">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!finalReason.trim() || isPending}
                                        className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50"
                                    >
                                        Gửi báo cáo
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}