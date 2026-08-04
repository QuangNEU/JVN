'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicJobs } from '@/features/jobs/hooks/usePublicJob';
import { useApprovedCategories } from '@/features/jobs/hooks/useCategory';
import { PublicJobFilterPayload, JobLevelType, JobTypeType } from '@/features/jobs/types/jobs';
import JobListCard from '@/components/ui/JobListCard';

const typeOptions: { value: JobTypeType; label: string }[] = [
    { value: 'FULLTIME', label: 'Toàn thời gian' },
    { value: 'PARTTIME', label: 'Bán thời gian' },
    { value: 'HYBRID', label: 'Hỗn hợp' },
    { value: 'REMOTE', label: 'Từ xa' },
];

const levelOptions: { value: JobLevelType; label: string }[] = [
    { value: 'INTERN', label: 'Intern' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'SENIOR', label: 'Senior' },
];

const PAGE_SIZE = 10;

function JobSearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [filters, setFilters] = useState<PublicJobFilterPayload>({
        keyword: searchParams.get('keyword') || undefined,
        location: searchParams.get('location') || undefined,
    });
    const [page, setPage] = useState(1);
    const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '');
    const [locationInput, setLocationInput] = useState(searchParams.get('location') || '');
    const [salaryMinInput, setSalaryMinInput] = useState('');
    const [salaryMaxInput, setSalaryMaxInput] = useState('');

    // đồng bộ lại nếu người dùng search lại từ trang chủ (URL đổi query)
    useEffect(() => {
        setKeywordInput(searchParams.get('keyword') || '');
        setLocationInput(searchParams.get('location') || '');
        setFilters((f) => ({
            ...f,
            keyword: searchParams.get('keyword') || undefined,
            location: searchParams.get('location') || undefined,
        }));
        setPage(1);
    }, [searchParams]);

    const { data: categories } = useApprovedCategories();
    const { data, isLoading, isError } = usePublicJobs({ ...filters, page, page_size: PAGE_SIZE });

    const jobs = data?.results ?? [];
    const totalCount = data?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    const applySearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (keywordInput) params.set('keyword', keywordInput);
        if (locationInput) params.set('location', locationInput);
        router.push(`/jobs/search?${params.toString()}`);
    };

    const toggleSingleFilter = <K extends keyof PublicJobFilterPayload>(key: K, value: PublicJobFilterPayload[K]) => {
        setFilters((f) => ({ ...f, [key]: f[key] === value ? undefined : value }));
        setPage(1);
    };

    const applySalaryRange = () => {
        setFilters((f) => ({
            ...f,
            salary_min: salaryMinInput ? Number(salaryMinInput) : undefined,
            salary_max: salaryMaxInput ? Number(salaryMaxInput) : undefined,
        }));
        setPage(1);
    };

    return (
        <div className="bg-slate-50">
            {/* Thanh tìm kiếm gọn, dính trên đầu */}
            <div className="sticky top-0 z-30 bg-blue-700 px-4 py-4 sm:px-6">
                <form onSubmit={applySearch} className="mx-auto flex max-w-5xl flex-col gap-2 rounded-xl bg-white p-1.5 sm:flex-row">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Vị trí tuyển dụng"
                            className="w-full py-2 text-sm text-slate-700 outline-none"
                        />
                    </div>
                    <div className="hidden w-px bg-slate-200 sm:block" />
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            placeholder="Địa điểm"
                            className="w-full py-2 text-sm text-slate-700 outline-none"
                        />
                    </div>
                    <button type="submit" className="shrink-0 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                {totalCount > 0 && (
                    <p className="mb-4 text-sm text-slate-500">
                        Tìm thấy <span className="font-semibold text-slate-800">{totalCount.toLocaleString('vi-VN')}</span> việc làm phù hợp
                    </p>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h2 className="mb-4 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
                            </h2>

                            <div className="mb-5">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Loại hình</p>
                                <div className="flex flex-wrap gap-2">
                                    {typeOptions.map((o) => (
                                        <button
                                            key={o.value}
                                            onClick={() => toggleSingleFilter('type', o.value)}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filters.type === o.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-5">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cấp bậc</p>
                                <div className="flex flex-wrap gap-2">
                                    {levelOptions.map((o) => (
                                        <button
                                            key={o.value}
                                            onClick={() => toggleSingleFilter('level', o.value)}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filters.level === o.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-5">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Mức lương (VND)</p>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Từ" value={salaryMinInput} onChange={(e) => setSalaryMinInput(e.target.value)} onBlur={applySalaryRange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500" />
                                    <span className="text-slate-300">–</span>
                                    <input type="number" placeholder="Đến" value={salaryMaxInput} onChange={(e) => setSalaryMaxInput(e.target.value)} onBlur={applySalaryRange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            {categories && categories.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Danh mục</p>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleSingleFilter('category_id', cat.id)}
                                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filters.category_id === cat.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                            >
                                                {cat.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    <div>
                        {isLoading ? (
                            <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-sm text-slate-400">Đang tải danh sách việc làm...</div>
                        ) : isError ? (
                            <div className="rounded-2xl border border-red-100 bg-red-50 py-16 text-center text-sm text-red-500">Không thể tải danh sách việc làm.</div>
                        ) : jobs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Không tìm thấy việc làm phù hợp.</div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map((job) => <JobListCard key={job.id} job={job} />)}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm text-slate-600">Trang {page} / {totalPages}</span>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function JobSearchPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>}>
            <JobSearchContent />
        </Suspense>
    );
}