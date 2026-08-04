import Link from 'next/link';
import { Building2, Calendar, MapPin } from 'lucide-react';
import { Application } from '@/features/applications/types/application';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from '@/constants/application';

function formatDate(value: string) {
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ApplicationCard({ application }: { application: Application }) {
    const { job_post, status, date_applied, cv } = application;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50">
                        {job_post.company_logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={job_post.company_logo} alt={job_post.company_name} className="h-full w-full object-cover" />
                        ) : (
                            <Building2 className="h-5 w-5 text-blue-500" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/jobs/${job_post.id}`}
                            className="line-clamp-1 text-sm font-bold text-slate-800 hover:text-blue-600"
                        >
                            {job_post.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{job_post.company_name}</p>
                    </div>
                </div>

                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[status]}`}>
                    {STATUS_LABELS[status]}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Ứng tuyển ngày {formatDate(date_applied)}
                </span>
                {job_post.company_province && (
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {job_post.company_province}
                    </span>
                )}
                {cv && (
                    <span className="flex items-center gap-1.5">
                        {/* ADJUST: đổi field hiển thị tên CV cho khớp CV type thật */}
                        CV: {cv.title ?? `#${cv.id}`}
                    </span>
                )}
            </div>
        </div>
    );
}