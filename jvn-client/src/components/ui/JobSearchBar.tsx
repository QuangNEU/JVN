'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building2, Clock } from 'lucide-react';
import { usePublicJobs } from '@/features/jobs/hooks/usePublicJob';

interface JobSearchBarProps {
    initialKeyword?: string;
    initialLocation?: string;
    variant?: 'hero' | 'compact';
}

export default function JobSearchBar({ initialKeyword = '', initialLocation = '', variant = 'hero' }: JobSearchBarProps) {
    const router = useRouter();
    const [keyword, setKeyword] = useState(initialKeyword);
    const [location, setLocation] = useState(initialLocation);
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // debounce 350ms trước khi fetch gợi ý, tránh gọi API mỗi phím gõ
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
        return () => clearTimeout(timer);
    }, [keyword]);

    const { data, isFetching } = usePublicJobs({
        keyword: debouncedKeyword || undefined,
        page: 1,
        page_size: 5,
    });

    const suggestions = debouncedKeyword ? (data?.results ?? []) : [];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const goToSearch = (kw?: string) => {
        const params = new URLSearchParams();
        const k = kw ?? keyword;
        if (k) params.set('keyword', k);
        if (location) params.set('location', location);
        setIsOpen(false);
        router.push(`/jobs?${params.toString()}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        goToSearch();
    };

    const isHero = variant === 'hero';

    return (
        <div ref={wrapperRef} className="relative">
            <form
                onSubmit={handleSubmit}
                className={`flex flex-col gap-2 rounded-2xl bg-white shadow-xl sm:flex-row ${isHero ? 'p-2' : 'p-1.5 rounded-xl shadow-none'}`}
            >
                <div className="flex flex-1 items-center gap-2 px-3">
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Vị trí tuyển dụng, tên công ty"
                        className={`w-full text-sm text-slate-700 outline-none ${isHero ? 'py-2.5' : 'py-2'}`}
                    />
                </div>
                <div className="hidden w-px bg-slate-200 sm:block" />
                <div className="flex flex-1 items-center gap-2 px-3">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Địa điểm"
                        className={`w-full text-sm text-slate-700 outline-none ${isHero ? 'py-2.5' : 'py-2'}`}
                    />
                </div>
                <button
                    type="submit"
                    className={`shrink-0 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 ${isHero ? 'px-6 py-2.5 text-sm' : 'px-6 py-2.5 text-sm'}`}
                >
                    Tìm kiếm
                </button>
            </form>

            {/* Dropdown gợi ý */}
            {isOpen && debouncedKeyword && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                    <div className="max-h-[420px] overflow-y-auto p-4">
                        <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Việc làm có thể bạn quan tâm
                        </p>

                        {isFetching ? (
                            <p className="px-1 py-4 text-center text-sm text-slate-400">Đang tìm kiếm...</p>
                        ) : suggestions.length === 0 ? (
                            <p className="px-1 py-4 text-center text-sm text-slate-400">
                                Không tìm thấy việc làm phù hợp với "{debouncedKeyword}"
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {suggestions.map((job) => (
                                    <button
                                        key={job.id}
                                        type="button"
                                        onClick={() => router.push(`/jobs/${job.id}`)}
                                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-blue-50"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                            <Building2 className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800">{job.title}</p>
                                            <p className="truncate text-xs text-slate-500">{job.company_name}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs font-bold text-blue-600">
                                                {job.is_negotiable ? 'Thỏa thuận' : job.salary_min ? `${Number(job.salary_min).toLocaleString('vi-VN')}+` : ''}
                                            </p>
                                            <p className="flex items-center gap-1 text-[11px] text-slate-400">
                                                <Clock className="h-3 w-3" /> {job.company_province || ''}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => goToSearch()}
                            className="block w-full border-t border-slate-100 bg-slate-50 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                            Xem tất cả kết quả cho "{debouncedKeyword}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}