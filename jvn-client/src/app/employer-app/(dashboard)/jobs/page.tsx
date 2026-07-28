// employer-app/(dashboard)/jobs/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { useCompanyJobs, useDeleteJobPost } from '@/features/jobs/hooks/useCompanyJobs';
import { JobPostListParams, JobPost, JobStatusType } from '@/features/jobs/types/jobs';

const statusConfig: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: 'Đang tuyển', className: 'bg-emerald-50 text-emerald-700' },
    CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-500' },
};

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
    return 'Chưa cập nhật';
}

function isExpiringSoon(expirationDate: string | null) {
    if (!expirationDate) return false;
    const daysLeft = (new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 3;
}

const statusTabs: { label: string; value: JobStatusType | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Đang tuyển', value: 'PUBLISHED' },
    { label: 'Đã đóng', value: 'CLOSED' },
];

export default function CompanyJobsPage() {
    const [filters, setFilters] = useState<JobPostListParams>({ page: 1 });
    const [keywordInput, setKeywordInput] = useState('');

    const { data, isLoading, isError } = useCompanyJobs(filters);
    const deleteMutation = useDeleteJobPost();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters((f) => ({ ...f, keyword: keywordInput, page: 1 }));
    };

    const handleDelete = (id: number) => {
        if (confirm('Bạn chắc chắn muốn xóa tin này?')) {
            deleteMutation.mutate(id);
        }
    };

    const jobs = data?.results || [];
    const totalCount = data?.count || 0;


    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tin tuyển dụng</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {totalCount > 0 ? `${totalCount} tin đã đăng` : 'Quản lý toàn bộ tin đã đăng của công ty bạn'}
                    </p>
                </div>
                <Link
                    href="/jobs/new"
                    className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600"
                >
                    <Plus className="h-4 w-4" /> Đăng tin mới
                </Link>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setFilters((f) => ({ ...f, status: tab.value, page: 1 }))}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filters.status === tab.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Tìm theo tên vị trí..."
                        className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500"
                    />
                </form>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-sm text-slate-400">
                    Đang tải danh sách...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 py-16 text-center text-sm text-red-500">
                    Không thể tải danh sách tin tuyển dụng.
                </div>
            ) : jobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                    <p className="text-sm text-slate-500">Không tìm thấy tin tuyển dụng nào.</p>
                    <Link href="/jobs/new" className="mt-3 inline-block text-sm font-semibold text-amber-600 hover:underline">
                        Đăng tin đầu tiên ngay
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <th className="px-6 py-3">Vị trí</th>
                                <th className="px-6 py-3">Loại hình / Cấp bậc</th>
                                <th className="px-6 py-3">Mức lương</th>
                                <th className="px-6 py-3">Trạng thái</th>
                                <th className="px-6 py-3">SL</th>
                                <th className="px-6 py-3">Ngày đăng</th>
                                <th className="px-6 py-3">Hạn nộp</th>
                                <th className="px-6 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => {
                                const expiringSoon = isExpiringSoon(job.expiration_date);
                                return (
                                    <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-500">{typeLabels[job.type]}</span>
                                                <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                                    {levelLabels[job.level]}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{formatSalary(job)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[job.status]?.className}`}>
                                                {statusConfig[job.status]?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{job.headcount}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {job.date_posted
                                                ? new Date(job.date_posted).toLocaleDateString("vi-VN")
                                                : "Chưa cập nhật"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {job.expiration_date ? (
                                                <span className={expiringSoon ? 'font-semibold text-red-500' : 'text-slate-500'}>
                                                    {new Date(job.expiration_date).toLocaleDateString('vi-VN')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/jobs/${job.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link href={`/jobs/${job.id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(job.id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}