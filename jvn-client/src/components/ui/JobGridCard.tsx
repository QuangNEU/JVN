'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, Clock, Briefcase } from 'lucide-react';
import { JobPost } from '@/features/jobs/types/jobs';

function formatSalary(job: JobPost) {
    if (job.is_negotiable) return 'Thỏa thuận';
    const min = job.salary_min ? Number(job.salary_min).toLocaleString('vi-VN') : null;
    const max = job.salary_max ? Number(job.salary_max).toLocaleString('vi-VN') : null;
    if (min && max) return `${min} - ${max} ${job.currency}`;
    if (min) return `Từ ${min} ${job.currency}`;
    if (max) return `Đến ${max} ${job.currency}`;
    return 'Thỏa thuận';
}

function timeAgo(dateStr: string | null) {
    if (!dateStr) return '';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 30) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

const PANEL_WIDTH = 400;
const PANEL_GAP = 14;

export default function JobGridCard({ job }: { job: JobPost }) {
    const router = useRouter();
    const cardRef = useRef<HTMLAnchorElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number; openLeft: boolean } | null>(null);

    const clearCloseTimer = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const scheduleClose = () => {
        clearCloseTimer();
        closeTimer.current = setTimeout(() => setIsOpen(false), 120);
    };

    const handleEnter = () => {
        clearCloseTimer();
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const openLeft = rect.right + PANEL_GAP + PANEL_WIDTH > viewportWidth;
        const left = openLeft ? rect.left - PANEL_WIDTH - PANEL_GAP : rect.right + PANEL_GAP;

        const estimatedHeight = 380;
        let top = rect.top;
        if (top + estimatedHeight > viewportHeight - 16) {
            top = Math.max(16, viewportHeight - estimatedHeight - 16);
        }

        setPos({ top, left, openLeft });
        setIsOpen(true);
    };

    return (
        <>
            <Link
                ref={cardRef}
                href={`/jobs/${job.id}`}
                onMouseEnter={handleEnter}
                onMouseLeave={scheduleClose}
                className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 group-hover:text-blue-600">
                            {job.title}
                        </h3>
                        <p className="mt-1 truncate text-xs text-slate-500">{job.company_name}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        {job.company_province || 'Đang cập nhật'}
                    </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-sm font-bold text-blue-600">{formatSalary(job)}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {timeAgo(job.date_posted)}
                    </span>
                </div>
            </Link>

            {isOpen && pos && (
                <div
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleClose}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: PANEL_WIDTH }}
                    className="z-50 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:block"
                >
                    <div className="max-h-[70vh] overflow-y-auto p-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-base font-bold leading-snug text-slate-800">{job.title}</h4>
                                <p className="mt-0.5 text-sm text-slate-500">{job.company_name}</p>
                            </div>
                        </div>

                        <p className="mt-3 text-lg font-bold text-blue-600">{formatSalary(job)}</p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                <MapPin className="h-3.5 w-3.5" /> {job.company_province || 'Chưa cập nhật'}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                <Briefcase className="h-3.5 w-3.5" /> {job.experience_requirement}
                            </span>
                        </div>

                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Mô tả công việc</p>
                            <p className="line-clamp-5 text-sm leading-relaxed text-slate-600">{job.descriptions}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 bg-white p-4">
                        <button
                            onClick={(e) => { e.preventDefault(); router.push(`/jobs/${job.id}`); }}
                            className="flex-1 rounded-full border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                            Xem chi tiết
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); router.push(`/jobs/${job.id}`); }}
                            className="flex-1 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                        >
                            Ứng tuyển
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}