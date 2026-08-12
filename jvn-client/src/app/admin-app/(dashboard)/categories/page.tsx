'use client';

import { CheckCircle2, XCircle, FolderTree } from 'lucide-react';
import { usePendingCategories, useApproveCategory, useDenyCategory } from '@/features/jobs/hooks/useCategory';

export default function AdminCategoriesPage() {
    const { data: categories, isLoading } = usePendingCategories();
    const approveMutation = useApproveCategory();
    const denyMutation = useDenyCategory();

    return (
        <div>
            <h1 className="mb-6 text-2xl font-bold text-slate-800">Duyệt danh mục nghề</h1>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center text-sm text-slate-400">Đang tải...</div>
            ) : !categories?.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
                    Không có danh mục nào đang chờ duyệt.
                </div>
            ) : (
                <div className="space-y-3">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5">
                            <div className="flex items-center gap-3">
                                <FolderTree className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="font-semibold text-slate-800">{cat.title}</p>
                                    <p className="text-xs text-slate-400">ID: {cat.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => approveMutation.mutate(cat.id)}
                                    disabled={approveMutation.isPending}
                                    className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="h-4 w-4" /> Duyệt
                                </button>
                                <button
                                    onClick={() => denyMutation.mutate(cat.id)}
                                    disabled={denyMutation.isPending}
                                    className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                    <XCircle className="h-4 w-4" /> Từ chối
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}