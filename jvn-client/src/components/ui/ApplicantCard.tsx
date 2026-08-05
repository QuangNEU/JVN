'use client';

import { useState } from 'react';
import { FileText, Calendar } from 'lucide-react';
import { CompanyApplication } from '@/features/applications/types/application';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/constants/application';
import UpdateStatusModal from './UpdateStatusModal';

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ApplicantCard({ jobId, application }: { jobId: number; application: CompanyApplication }) {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-slate-800">{application.applicant_name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" /> Ứng tuyển ngày {formatDate(application.date_applied)}
                    </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[application.status]}`}>
                    {STATUS_LABELS[application.status]}
                </span>
            </div>

            {application.cover_letter && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{application.cover_letter}</p>
            )}

            {application.status === 'INTERVIEWING' && application.interview_date && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2 text-sm text-amber-700">
                    Lịch phỏng vấn: {new Date(application.interview_date).toLocaleString('vi-VN')}
                </p>
            )}

            {application.status === 'REJECTED' && application.rejected_reason && (
                <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-600">
                    Lý do từ chối: {application.rejected_reason}
                </p>
            )}

            <div className="mt-4 flex items-center gap-3">
                {/* ADJUST: đổi field CV thật (vd application.cv.file_url) nếu tên field khác */}
                <a
                    href={application.cv.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50"
                >
                    <FileText className="h-4 w-4" /> Xem CV
                </a>
                <button
                    onClick={() => setShowModal(true)}
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                    Cập nhật trạng thái
                </button>
            </div>

            <UpdateStatusModal
                jobId={jobId}
                application={application}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}