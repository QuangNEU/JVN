'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Sparkles, LayoutGrid, Search } from 'lucide-react';
import { useApprovedCategories } from '@/features/jobs/hooks/useCategory';
import { Category } from '@/features/jobs/types/jobs';

const ITEMS_PER_PAGE = 4;

export default function CategoryBrowseSection() {
    const { data: categories, isLoading } = useApprovedCategories();
    const hasCategories = categories && categories.length > 0;
    const [hovered, setHovered] = useState<Category | null>(null);
    const [page, setPage] = useState(1);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil((categories?.length ?? 0) / ITEMS_PER_PAGE)),
        [categories]
    );

    const visibleCategories = useMemo(() => {
        if (!categories) return [];
        const start = (page - 1) * ITEMS_PER_PAGE;
        return categories.slice(start, start + ITEMS_PER_PAGE);
    }, [categories, page]);

    const goToPage = (next: number) => {
        setPage(next);
        setHovered(null);
    };

    return (
        <div
            className="grid min-h-[240px] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-lg sm:grid-cols-[1fr_1.3fr]"
            onMouseLeave={() => setHovered(null)}
        >
            {/* Danh sách danh mục */}
            <div className="flex flex-col p-2">
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center py-10">
                        <p className="text-sm text-slate-400">Đang tải danh mục...</p>
                    </div>
                ) : hasCategories ? (
                    <>
                        <div className="flex-1 divide-y divide-slate-100">
                            {visibleCategories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    href={`/jobs?category_ids=${cat.id}`}
                                    onMouseEnter={() => setHovered(cat)}
                                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors ${hovered?.id === cat.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hovered?.id === cat.id ? 'bg-blue-100' : 'bg-blue-50'} text-blue-500`}>
                                        <LayoutGrid className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1 truncate">{cat.title}</span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                                </Link>
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                                <span className="text-sm font-medium text-slate-400">
                                    {page}/{totalPages}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-400">
                            <LayoutGrid className="h-6 w-6" />
                        </span>
                        <p className="text-sm text-slate-500">Chưa có danh mục nghề nào được duyệt.</p>
                        <Link
                            href="/jobs"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
                        >
                            <Search className="h-3.5 w-3.5" /> Xem tất cả việc làm
                        </Link>
                    </div>
                )}
            </div>

            {/* Bên phải: đổi giữa banner tĩnh và danh mục con theo hover */}
            {hovered ? (
                <div className="flex flex-col overflow-y-auto bg-slate-50 p-6">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Ngành nghề trong "{hovered.title}"
                    </p>

                    {hovered.children && hovered.children.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {hovered.children.map((child) => (
                                <Link
                                    key={child.id}
                                    href={`/jobs?category_ids=${child.id}`}
                                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                                >
                                    {child.title}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
                            <p className="text-sm text-slate-400">Chưa có danh mục con.</p>
                            <Link
                                href={`/jobs?category_ids=${hovered.id}`}
                                className="text-sm font-semibold text-blue-600 hover:underline"
                            >
                                Xem việc làm "{hovered.title}"
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

                    <div className="relative">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            <Sparkles className="h-3.5 w-3.5" /> JVN Job Portal
                        </span>
                        <h3 className="mt-4 text-xl font-bold leading-snug sm:text-2xl">
                            Kết nối ứng viên với nhà tuyển dụng uy tín
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-blue-100">
                            Tạo hồ sơ, tìm việc phù hợp và ứng tuyển chỉ trong vài phút.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}