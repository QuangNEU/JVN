'use client';

import { useState } from 'react';
import { useMyCategoryRequests } from '../hooks/useCategory';
import CategoryRequestForm from './CategoryRequestForm';
import { CategoryRequestItem } from '../types/jobs';

type CategoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_LABEL: Record<CategoryStatus, string> = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
};

const STATUS_COLOR: Record<CategoryStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function MyCategoryRequestList() {
    const [statusFilter, setStatusFilter] = useState<CategoryStatus | undefined>(undefined);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, isLoading, isError } = useMyCategoryRequests(
        statusFilter ? { status: statusFilter } : undefined
    );

    if (isLoading) return <p className="text-sm text-gray-500">Đang tải danh sách...</p>;
    if (isError) return <p className="text-sm text-red-600">Không tải được danh sách, thử lại sau.</p>;

    const items = data?.results ?? [];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {([undefined, 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                    <button
                        key={s ?? 'all'}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {s ? STATUS_LABEL[s] : 'Tất cả'}
                    </button>
                ))}
            </div>

            {items.length === 0 && <p className="text-sm text-gray-500">Chưa có đề xuất nào.</p>}

            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {items.map((item: CategoryRequestItem) => (
                    <li key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{item.title}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                                {STATUS_LABEL[item.status]}
                            </span>
                        </div>

                        {item.status === 'REJECTED' && (
                            <div className="mt-2 space-y-2">
                                {item.rejected_reason && (
                                    <p className="text-sm text-red-600">Lý do từ chối: {item.rejected_reason}</p>
                                )}
                                {editingId === item.id ? (
                                    <CategoryRequestForm
                                        mode="resubmit"
                                        categoryId={item.id}
                                        initialData={{ title: item.title, parent_id: item.parent ?? undefined }}
                                        onSuccess={() => setEditingId(null)}
                                    />
                                ) : (
                                    <button onClick={() => setEditingId(item.id)} className="text-sm font-medium text-slate-700 hover:underline">
                                        Sửa và gửi lại
                                    </button>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}