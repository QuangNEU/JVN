'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePublicJobs } from '@/features/jobs/hooks/usePublicJob';
import { useApprovedCategories } from '@/features/jobs/hooks/useCategory';
import { PublicJobFilterPayload, JobLevelType, JobTypeType } from '@/features/jobs/types/jobs';
import JobListCard from '@/components/ui/JobListCard';
import CategoryCheckboxTree from '@/features/jobs/components/CategoryCheckboxTree';
import { SelectedLocation } from '@/features/locations/types/vnLocations';
import LocationPickerModal from '@/features/locations/components/LocationPickerModal';

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


    const [page, setPage] = useState(1);
    const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '');
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState<SelectedLocation[]>(
        searchParams.getAll('locations').map((name) => ({
            key: `province:${name}`,
            type: 'province' as const,
            provinceCode: name,
            provinceName: name,
            name,
        }))
    );
    const [salaryMinInput, setSalaryMinInput] = useState('');
    const [salaryMaxInput, setSalaryMaxInput] = useState('');

    const [filters, setFilters] = useState<PublicJobFilterPayload>({
        keyword: searchParams.get('keyword') || undefined,
        locations: searchParams.getAll('locations').length ? searchParams.getAll('locations') : undefined,
        category_ids: searchParams.getAll('category_ids').map(Number),
    });

    useEffect(() => {
        setKeywordInput(searchParams.get('keyword') || '');
        const urlLocations = searchParams.getAll('locations');
        setSelectedLocations(
            urlLocations.map((name) => ({
                key: `province:${name}`,
                type: 'province',
                provinceCode: name,
                provinceName: name,
                name,
            }))
        );
        setFilters((f) => ({
            ...f,
            keyword: searchParams.get('keyword') || undefined,
            locations: urlLocations.length ? urlLocations : undefined,
            category_ids: searchParams.getAll('category_ids').map(Number),
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
        selectedLocations.forEach((loc) => params.append('locations', loc.name));
        router.push(`/jobs?${params.toString()}`);
    };

    const applyLocations = (locations: SelectedLocation[]) => {
        setSelectedLocations(locations);
        setFilters((f) => ({ ...f, locations: locations.length ? locations.map((l) => l.name) : undefined }));
        setPage(1);
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
                        <div className="hidden w-px bg-slate-200 sm:block" />
                        <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="flex flex-1 items-center gap-2 px-3 py-2 text-left"
                        >
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className={`flex-1 text-sm ${selectedLocations.length ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                                {getLocationSummaryLabel(selectedLocations) ?? 'Địa điểm'}
                            </span>
                            {selectedLocations.length > 0 && (
                                <X
                                    className="h-3.5 w-3.5 shrink-0 text-slate-400 hover:text-slate-600"
                                    onClick={(e) => { e.stopPropagation(); applyLocations([]); }}
                                />
                            )}
                        </button>
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
                                    <CategoryCheckboxTree
                                        categories={categories}
                                        selectedIds={filters.category_ids ?? []}
                                        onChange={(ids) => {
                                            setFilters((f) => ({ ...f, category_ids: ids }));
                                            setPage(1);
                                        }}
                                        mode="filter"
                                    />
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
            <LocationPickerModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                onApply={applyLocations}
                initialSelected={selectedLocations}
            />
        </div>
    );
}
function getLocationSummaryLabel(selected: SelectedLocation[]): string | null {
    if (selected.length === 0) return null;
    const groups = new Map<string, number>();
    selected.forEach((s) => groups.set(s.provinceName, (groups.get(s.provinceName) ?? 0) + 1));
    const entries = [...groups.entries()];
    const [firstProvince, count] = entries[0];
    return entries.length === 1 ? `${firstProvince} (${count})` : `${firstProvince} (${count}) +${entries.length - 1} tỉnh khác`;
}
export default function JobSearchPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>}>
            <JobSearchContent />
        </Suspense>
    );
}