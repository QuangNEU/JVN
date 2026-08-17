'use client';

import { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { useFeaturedCompanies, useSearchCompanies } from '@/features/companines/hooks/useCompanies';
import CompanyCard from '@/features/companines/components/CompanyCard';

export default function CompaniesPage() {
    const [keywordInput, setKeywordInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);

    const { data: featured, isLoading: isLoadingFeatured } = useFeaturedCompanies();
    const { data: searchResult, isLoading: isLoadingSearch } = useSearchCompanies({ keyword: keyword || undefined, page });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setKeyword(keywordInput.trim());
        setPage(1);
    };

    return (
        <div className="bg-slate-50 pb-16">
            <div className="bg-blue-700 px-4 py-10 sm:px-6">
                <h1 className="mx-auto max-w-3xl text-center text-2xl font-bold text-white">
                    Tìm kiếm thông tin công ty để kết nối với cơ hội việc làm phù hợp nhất
                </h1>
                <form onSubmit={handleSearch} className="mx-auto mt-5 flex max-w-2xl gap-2 rounded-xl bg-white p-1.5">
                    <div className="flex flex-1 items-center gap-2 px-3">
                        <Search className="h-4 w-4 shrink-0 text-slate-400" />
                        <input
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder="Tên công ty..."
                            className="w-full py-2 text-sm text-slate-700 outline-none"
                        />
                    </div>
                    <button type="submit" className="shrink-0 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                        Tìm kiếm
                    </button>
                </form>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                {!keyword ? (
                    <>
                        <h2 className="mb-4 text-lg font-bold text-slate-800">Danh sách công ty nổi bật</h2>
                        {isLoadingFeatured ? (
                            <div className="py-12 text-center text-sm text-slate-400">Đang tải...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {featured?.map((c) => <CompanyCard key={c.id} company={c} />)}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <p className="mb-4 text-sm text-slate-500">
                            Tìm thấy <span className="font-semibold text-slate-800">{searchResult?.count ?? 0}</span> công ty phù hợp
                        </p>
                        {isLoadingSearch ? (
                            <div className="py-12 text-center text-sm text-slate-400">Đang tìm kiếm...</div>
                        ) : !searchResult || searchResult.results.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                                <Building2 className="h-8 w-8 text-slate-300" />
                                <p className="text-sm text-slate-500">Không tìm thấy công ty phù hợp.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {searchResult.results.map((c) => <CompanyCard key={c.id} company={c} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}