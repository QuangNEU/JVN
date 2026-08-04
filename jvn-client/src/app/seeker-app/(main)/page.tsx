'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePublicJobs } from '@/features/jobs/hooks/usePublicJob';
import JobGridCard from '@/components/ui/JobGridCard';
import JobSearchBar from '@/components/ui/JobSearchBar';
import CategoryBrowseSection from '@/components/ui/CategoryBrowseSection';


export default function SeekerHomePage() {
    const router = useRouter();
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');

    const { data, isLoading, isError } = usePublicJobs({ page: 1, page_size: 9 });
    const jobs = data?.results ?? [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (keyword) params.set('keyword', keyword);
        if (location) params.set('location', location);
        router.push(`/jobs?${params.toString()}`);
    };

    return (
        <div className="bg-slate-50">
            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

                <div className="relative mx-auto max-w-5xl text-center">
                    <h1 className="text-2xl font-bold text-white sm:text-4xl">
                        Tìm việc làm nhanh, việc làm mới nhất
                    </h1>
                    <p className="mt-3 text-sm text-blue-100 sm:text-base">
                        Tiếp cận hàng nghìn tin tuyển dụng từ các doanh nghiệp uy tín tại Việt Nam
                    </p>

                    <div className="mt-7">
                        <JobSearchBar variant="hero" />
                    </div>

                    <div className="mt-6 text-left">
                        <CategoryBrowseSection />
                    </div>
                </div>
            </div>

            {/* Việc làm tốt nhất */}
            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Việc làm tốt nhất</h2>
                    <Link href="/jobs" className="text-sm font-semibold text-blue-600 hover:underline">
                        Xem tất cả
                    </Link>
                </div>

                <p className="mb-4 rounded-xl bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
                    💡 Gợi ý: Di chuột vào tiêu đề việc làm để xem thêm thông tin chi tiết
                </p>

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-sm text-slate-400">
                        Đang tải việc làm...
                    </div>
                ) : isError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 py-16 text-center text-sm text-red-500">
                        Không thể tải danh sách việc làm.
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
                        Chưa có việc làm nào được đăng.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {jobs.map((job) => (
                            <JobGridCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}