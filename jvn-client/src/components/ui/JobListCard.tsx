import Link from 'next/link';
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
    if (days <= 0) return 'Đăng hôm nay';
    if (days === 1) return 'Đăng hôm qua';
    if (days < 30) return `Đăng ${days} ngày trước`;
    return `Đăng ${new Date(dateStr).toLocaleDateString('vi-VN')}`;
}

export default function JobListCard({ job }: { job: JobPost }) {
    return (
        <Link
            href={`/jobs/${job.id}`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
        >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <Building2 className="h-6 w-6 text-blue-600" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600">{job.title}</h3>
                    <span className="shrink-0 text-sm font-bold text-blue-600">{formatSalary(job)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{job.company_name}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {job.company_province && (
                        <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                            <MapPin className="h-3 w-3" /> {job.company_province}
                        </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                        <Briefcase className="h-3 w-3" /> {job.experience_requirement}
                    </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                        {job.level}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="h-3 w-3" /> {timeAgo(job.date_posted)}
                    </span>
                </div>
            </div>
        </Link>
    );
}