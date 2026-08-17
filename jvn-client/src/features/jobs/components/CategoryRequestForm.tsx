'use client';

import { useState, FormEvent } from 'react';
import { useGetApprovedCategories, useCreateCategory, useResubmitCategory } from '../hooks/useCategory';
import { Category, CategoryRequestPayload } from '../types/jobs';

interface CategoryRequestFormProps {
    mode: 'create' | 'resubmit';
    categoryId?: number;
    initialData?: CategoryRequestPayload;
    onSuccess?: () => void;
}

export default function CategoryRequestForm({ mode, categoryId, initialData, onSuccess }: CategoryRequestFormProps) {
    const [title, setTitle] = useState(initialData?.title ?? '');
    const [parentId, setParentId] = useState<number | undefined>(initialData?.parent_id);

    const { data: approvedCategories, isLoading: loadingParents } = useGetApprovedCategories();
    const createMutation = useCreateCategory();
    const resubmitMutation = useResubmitCategory();

    const isSubmitting = createMutation.isPending || resubmitMutation.isPending;
    const errorMessage =
        (createMutation.error as any)?.response?.data?.error ||
        (resubmitMutation.error as any)?.response?.data?.error;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!title.trim() || isSubmitting) return; // chặn double-submit

        const payload: CategoryRequestPayload = { title: title.trim(), parent_id: parentId };

        if (mode === 'create') {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    setTitle('');
                    setParentId(undefined);
                    onSuccess?.();
                },
            });
        } else {
            if (!categoryId) return;
            resubmitMutation.mutate({ categoryId, data: payload }, { onSuccess: () => onSuccess?.() });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <div>
                <label htmlFor="category-title" className="mb-1 block text-sm font-medium text-gray-700">
                    Tên danh mục
                </label>
                <input
                    id="category-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Lập trình Backend"
                    maxLength={255}
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="category-parent" className="mb-1 block text-sm font-medium text-gray-700">
                    Danh mục cha (không bắt buộc)
                </label>
                <select
                    id="category-parent"
                    value={parentId ?? ''}
                    onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={loadingParents}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="">— Không có, đây là danh mục gốc —</option>
                    {(approvedCategories ?? []).map((cat: Category) => (
                        <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                    Hệ thống chỉ hỗ trợ tối đa 2 cấp, nên chỉ chọn được danh mục gốc đã duyệt làm cha.
                </p>
            </div>

            {errorMessage && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isSubmitting ? 'Đang gửi...' : mode === 'create' ? 'Gửi đề xuất' : 'Gửi lại'}
            </button>
        </form>
    );
}