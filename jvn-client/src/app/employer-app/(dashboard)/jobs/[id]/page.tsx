'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Pencil, Trash2, MapPin, Users, Calendar,
    Clock, Wallet, Briefcase, Layers, Tag as TagIcon,
    CheckCircle2, PauseCircle, Building2,
} from 'lucide-react';
import { useJobPostDetail, useDeleteJobPost, useUpdateJobPost } from '@/features/jobs/hooks/useCompanyJobs';

const typeLabels: Record<string, string> = {
    FULLTIME: 'Toàn thời gian',
    PARTTIME: 'Bán thời gian',
    HYBRID: 'Hỗn hợp',
    REMOTE: 'Làm việc từ xa',
};

const levelLabels: Record<string, string> = {
    INTERN: 'Intern',
    FRESHER: 'Fresher',
    JUNIOR: 'Junior',
    SENIOR: 'Senior',
};

function formatSalary(job: { is_negotiable: boolean; salary_min: string | null; salary_max: string | null; currency: string }) {
    if (job.is_negotiable) return 'Thỏa thuận';
    const min = job.salary_min ? Number(job.salary_min).toLocaleString('vi-VN') : null;
    const max = job.salary_max ? Number(job.salary_max).toLocaleString('vi-VN') : null;
    if (min && max) return `${min} - ${max} ${job.currency}`;
    if (min) return `Từ ${min} ${job.currency}`;
    if (max) return `Đến ${max} ${job.currency}`;
    return 'Chưa cập nhật';
}

function formatDate(value: string | null) {
    if (!value) return 'Chưa cập nhật';
    return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(expirationDate: string | null) {
    if (!expirationDate) return null;
    const diff = (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
}

export default function JobPostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const { data: job, isLoading, isError } = useJobPostDetail(id);
    const deleteMutation = useDeleteJobPost();
    const updateMutation = useUpdateJobPost();
    const [actionError, setActionError] = useState('');

    const handleDelete = () => {
        if (!confirm('Bạn chắc chắn muốn xóa tin tuyển dụng này? Hành động này không thể hoàn tác.')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => router.push('/jobs'),
            onError: () => setActionError('Xóa tin thất bại, vui lòng thử lại.'),
        });
    };

    const handleToggleStatus = () => {
        if (!job) return;
        const nextStatus = job.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
        setActionError('');
        updateMutation.mutate(
            { id, payload: { status: nextStatus } as any },
            { onError: () => setActionError('Cập nhật trạng thái thất bại, vui lòng thử lại.') }
        );
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-400">
                Đang tải tin tuyển dụng...
            </div>
        );
    }

    if (isError || !job) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-red-500">Không thể tải tin tuyển dụng này.</p>
                <Link href="/jobs" className="text-sm font-semibold text-amber-600 hover:underline">
                    Quay lại danh sách
                </Link>
            </div>
        );
    }

    const remaining = daysLeft(job.expiration_date);
    const isPublished = job.status === 'PUBLISHED';

    return (
        <div className="mx-auto max-w-5xl pb-16">
            {/* Back link */}
            <Link
                href="/jobs"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
            </Link>

            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-8 sm:px-8 sm:py-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isPublished ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-400/15 text-slate-300'
                                    }`}
                            >
                                {isPublished ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
                                {isPublished ? 'Đang tuyển' : 'Đã đóng'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                                <Layers className="h-3.5 w-3.5" />
                                {levelLabels[job.level] ?? job.level}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{job.title}</h1>

                        <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-300">
                            <Building2 className="h-4 w-4" />
                            {job.company_name}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="h-4 w-4 text-amber-400" />
                                {typeLabels[job.type] ?? job.type}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-amber-400" />
                                Cần tuyển {job.headcount} người
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-amber-400" />
                                Đăng ngày {formatDate(job.date_posted)}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2 sm:flex-col">
                        <Link
                            href={`/jobs/${job.id}/edit`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 sm:flex-none"
                        >
                            <Pencil className="h-4 w-4" />
                            Sửa tin
                        </Link>
                        <button
                            onClick={handleToggleStatus}
                            disabled={updateMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50 sm:flex-none"
                        >
                            {isPublished ? <PauseCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isPublished ? 'Đóng tin' : 'Mở lại tin'}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 sm:flex-none"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa tin
                        </button>
                    </div>
                </div>
            </div>

            {actionError && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{actionError}</p>
            )}

            {/* Salary highlight */}
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500">
                    <Wallet className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Mức lương</p>
                    <p className="text-lg font-bold text-slate-800">{formatSalary(job)}</p>
                </div>
            </div>

            {/* Main content grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                        <h2 className="mb-3 text-base font-bold text-slate-800">Mô tả công việc</h2>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.descriptions}</p>
                    </section>

                    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                        <h2 className="mb-3 text-base font-bold text-slate-800">Yêu cầu ứng viên</h2>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.requirement}</p>
                    </section>

                    {job.benefit && (
                        <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                            <h2 className="mb-3 text-base font-bold text-slate-800">Quyền lợi</h2>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.benefit}</p>
                        </section>
                    )}
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                        <h2 className="mb-4 text-base font-bold text-slate-800">Thông tin chung</h2>
                        <dl className="space-y-3.5 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="flex items-center gap-1.5 text-slate-500">
                                    <Clock className="h-4 w-4" /> Kinh nghiệm
                                </dt>
                                <dd className="font-medium text-slate-700">{job.experience_requirement}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="flex items-center gap-1.5 text-slate-500">
                                    <Calendar className="h-4 w-4" /> Hạn nộp hồ sơ
                                </dt>
                                <dd
                                    className={`font-medium ${remaining !== null && remaining >= 0 && remaining <= 3
                                            ? 'text-red-500'
                                            : 'text-slate-700'
                                        }`}
                                >
                                    {formatDate(job.expiration_date)}
                                </dd>
                            </div>
                            {remaining !== null && (
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">Còn lại</dt>
                                    <dd className={`font-medium ${remaining < 0 ? 'text-slate-400' : remaining <= 3 ? 'text-red-500' : 'text-slate-700'}`}>
                                        {remaining < 0 ? 'Đã hết hạn' : `${remaining} ngày`}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>

                    {job.tags?.length > 0 && (
                        <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                            <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-slate-800">
                                <TagIcon className="h-4 w-4" /> Kỹ năng yêu cầu
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                                    >
                                        {tag.tag_name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {job.category?.length > 0 && (
                        <section className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                            <h2 className="mb-3 flex items-center gap-1.5 text-base font-bold text-slate-800">
                                <MapPin className="h-4 w-4" /> Danh mục ngành nghề
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {job.category.map((cat) => (
                                    <span
                                        key={cat.id}
                                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                                    >
                                        {cat.title}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}