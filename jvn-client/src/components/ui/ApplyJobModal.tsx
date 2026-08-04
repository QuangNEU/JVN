'use client';

import { useState } from 'react';
import { X, Send, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useApplyJob } from '@/features/applications/hooks/useApplyJob';
// ADJUST: đổi đúng hook + path bạn dùng để lấy danh sách CV của seeker
import { useCVs } from '@/features/resumes/hooks/useCVs';

interface ApplyJobModalProps {
    jobPostId: number;
    jobTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ApplyJobModal({ jobPostId, jobTitle, isOpen, onClose }: ApplyJobModalProps) {
    const [cvId, setCvId] = useState<number | ''>('');
    const [coverLetter, setCoverLetter] = useState('');

    // ADJUST: nếu hook trả về shape khác (vd { data } thay vì mảng trực tiếp), sửa dòng dưới
    const { data: cvs, isLoading: isLoadingCvs } = useCVs();
    const applyJob = useApplyJob(jobPostId);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (applyJob.isPending) return; // chặn double-submit
        if (!cvId) return;

        applyJob.mutate({ cv_id: cvId, cover_letter: coverLetter || undefined });
    };

    const handleClose = () => {
        applyJob.reset();
        setCvId('');
        setCoverLetter('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6">
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                    aria-label="Đóng"
                >
                    <X className="h-5 w-5" />
                </button>

                {applyJob.isSuccess ? (
                    <div className="flex flex-col items-center py-4 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                        <h3 className="mt-3 text-base font-bold text-slate-800">Ứng tuyển thành công!</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Hồ sơ của bạn đã được gửi tới nhà tuyển dụng. Bạn có thể theo dõi trạng thái
                            trong mục &quot;Việc làm đã ứng tuyển&quot;.
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-5 w-full rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                        >
                            Đóng
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h3 className="text-base font-bold text-slate-800">Ứng tuyển</h3>
                        <p className="mt-1 truncate text-sm text-slate-500">{jobTitle}</p>

                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Chọn CV <span className="text-red-500">*</span>
                            </label>

                            {isLoadingCvs ? (
                                <p className="text-sm text-slate-400">Đang tải danh sách CV...</p>
                            ) : !cvs || cvs.length === 0 ? (
                                <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700">
                                    Bạn chưa có CV nào. Vui lòng tạo CV trước khi ứng tuyển.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {cvs.map((cv) => (
                                        <label
                                            key={cv.id}
                                            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${cvId === cv.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="cv"
                                                className="accent-blue-600"
                                                checked={cvId === cv.id}
                                                onChange={() => setCvId(cv.id)}
                                            />
                                            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                            <span className="truncate font-medium text-slate-700">
                                                {/* ADJUST: đổi field hiển thị tên CV cho khớp CV type thật (vd cv.title) */}
                                                {cv.title ?? `CV #${cv.id}`}
                                            </span>
                                            {cv.is_default && (
                                                <span className="ml-auto shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                                                    Mặc định
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Thư giới thiệu (không bắt buộc)
                            </label>
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={4}
                                placeholder="Giới thiệu ngắn gọn về bản thân và lý do bạn phù hợp với vị trí này..."
                                className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                            />
                        </div>

                        {applyJob.isError && (
                            <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                                {applyJob.error instanceof Error ? applyJob.error.message : 'Ứng tuyển thất bại.'}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!cvId || applyJob.isPending}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {applyJob.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Gửi hồ sơ ứng tuyển
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}