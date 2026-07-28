import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

// Dữ liệu mẫu — sẽ thay bằng gọi API thật ở bước sau
const mockJobs = [
    { id: 1, title: 'Backend Developer (NodeJS)', status: 'PUBLISHED', headcount: 3, date_posted: '2026-07-20', applicants: 12 },
    { id: 2, title: 'Frontend Developer (React)', status: 'PUBLISHED', headcount: 2, date_posted: '2026-07-18', applicants: 8 },
    { id: 3, title: 'DevOps Engineer', status: 'CLOSED', headcount: 1, date_posted: '2026-07-01', applicants: 25 },
];

const statusConfig: Record<string, { label: string; className: string }> = {
    PUBLISHED: { label: 'Đang tuyển', className: 'bg-emerald-50 text-emerald-700' },
    CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-500' },
};

export default function CompanyJobsPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Tin tuyển dụng</h1>
                    <p className="mt-1 text-sm text-slate-500">Quản lý toàn bộ tin đã đăng của công ty bạn</p>
                </div>
                <Link
                    href="/jobs/new"
                    className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600"
                >
                    <Plus className="h-4 w-4" /> Đăng tin mới
                </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                            <th className="px-6 py-3">Vị trí</th>
                            <th className="px-6 py-3">Trạng thái</th>
                            <th className="px-6 py-3">Số lượng</th>
                            <th className="px-6 py-3">Ứng viên</th>
                            <th className="px-6 py-3">Ngày đăng</th>
                            <th className="px-6 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockJobs.map((job) => (
                            <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-800">{job.title}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[job.status].className}`}>
                                        {statusConfig[job.status].label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{job.headcount}</td>
                                <td className="px-6 py-4">
                                    <Link href={`/applicants?job=${job.id}`} className="font-semibold text-amber-600 hover:underline">
                                        {job.applicants} ứng viên
                                    </Link>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{job.date_posted}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/jobs/${job.id}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <Link href={`/jobs/${job.id}/edit`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}