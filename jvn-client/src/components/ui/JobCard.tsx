'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Users, Clock, MapPin, Building2, X } from 'lucide-react';
import { JobPost } from '@/features/jobs/types/jobs';

const typeLabels: Record<string, string> = {
    FULLTIME: 'Toàn thời gian',
    PARTTIME: 'Bán thời gian',
    HYBRID: 'Hỗn hợp',
    REMOTE: 'Từ xa',
};

const levelLabels: Record<string, string> = {
    INTERN: 'Intern',
    FRESHER: 'Fresher',
    JUNIOR: 'Junior',
    SENIOR: 'Senior',
};

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

function daysLeft(expirationDate: string | null) {
    if (!expirationDate) return null;
    const diff = (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
}

export default function JobCard({ job }: { job: JobPost }) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const remaining = daysLeft(job.expiration_date);

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card chính */}
            <Link
                href={`/jobs/${job.id}`}
                className="group block rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-slate-800 group-hover:text-blue-600">
                            {job.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">{job.company_name}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                            {job.company_province && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" /> {job.company_province}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Briefcase className="h-3.5 w-3.5" /> {typeLabels[job.type] ?? job.type}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> {timeAgo(job.date_posted)}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                                {levelLabels[job.level] ?? job.level}
                            </span>
                            <span className="text-sm font-bold text-blue-600">{formatSalary(job)}</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Hover preview panel - chỉ hiện khi rê chuột, không cản click vào card */}
            {isHovered && (
                <div className="absolute left-0 top-full z-30 mt-2 hidden w-full min-w-[380px] rounded-2xl border border-slate-100 bg-white p-5 shadow-xl lg:block">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-slate-800">{job.title}</h4>
                            <p className="text-sm text-slate-500">{job.company_name}</p>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {job.company_province || 'Chưa cập nhật địa điểm'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {job.experience_requirement}
                        </span>
                        {remaining !== null && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${remaining <= 3 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                {remaining < 0 ? 'Đã hết hạn' : `Còn ${remaining} ngày`}
                            </span>
                        )}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {job.descriptions}
                    </p>

                    <p className="mt-2 text-sm font-bold text-blue-600">{formatSalary(job)}</p>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`/jobs/${job.id}`);
                            }}
                            className="flex-1 rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                            Xem chi tiết
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`/jobs/${job.id}`);
                            }}
                            className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                        >
                            Ứng tuyển
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}