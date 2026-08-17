'use client';

import { useState } from 'react';
import { useAdminCategories, useApproveCategory, useDenyCategory } from '../hooks/useCategory';
import { CategoryRequestItem } from '../types/jobs';

type CategoryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_LABEL: Record<CategoryStatus, string> = {
    PENDING: 'Đang chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
};

export default function AdminCategoryReviewList() {
    const [statusFilter, setStatusFilter] = useState<CategoryStatus>('PENDING');
    const [denyingId, setDenyingId] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    const { data, isLoading, isError } = useAdminCategories({ status: statusFilter });
    const approveMutation = useApproveCategory();
    const denyMutation = useDenyCategory();

    function submitDeny() {
        if (!denyingId || !reason.trim() || denyMutation.isPending) return;
        denyMutation.mutate(
            { categoryId: denyingId, reason: reason.trim() },
            { onSuccess: () => setDenyingId(null) }
        );
    }

    if (isLoading) return <p className="text-sm text-gray-500">Đang tải...</p>;
    if (isError) return <p className="text-sm text-red-600">Không tải được danh sách.</p>;

    const items = data?.results ?? [];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {STATUS_LABEL[s]}
                    </button>
                ))}
            </div>

            {items.length === 0 && <p className="text-sm text-gray-500">Không có danh mục nào.</p>}

            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {items.map((item: CategoryRequestItem) => (
                    <li key={item.id} className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-400">
                                Gửi lúc: {new Date(item.created_at).toLocaleDateString('vi-VN', {
                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                            {item.rejected_reason && (
                                <p className="text-xs text-red-500">Lý do từ chối trước đó: {item.rejected_reason}</p>
                            )}
                        </div>

                        {item.status === 'PENDING' && (
                            <div className="flex gap-2">
                                {item.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveMutation.mutate(item.id)}
                                            disabled={approveMutation.isPending}
                                            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            onClick={() => { setDenyingId(item.id); setReason(''); }}
                                            className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {denyingId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
                        <h3 className="mb-3 text-sm font-semibold text-gray-900">Lý do từ chối</h3>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            required
                            placeholder="Nhập lý do để công ty biết cần sửa gì..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setDenyingId(null)} className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                                Huỷ
                            </button>
                            <button
                                onClick={submitDeny}
                                disabled={!reason.trim() || denyMutation.isPending}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {denyMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}