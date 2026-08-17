'use client';

import { useState } from 'react';
import CategoryRequestForm from '@/features/jobs/components/CategoryRequestForm';
import MyCategoryRequestList from '@/features/jobs/components/MyCategoryRequestList';

export default function CompanyCategoriesPage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Đề xuất danh mục ngành nghề</h1>
                    <p className="text-sm text-gray-500">
                        Không tìm thấy ngành nghề phù hợp khi đăng tin? Gửi đề xuất để Admin xem xét thêm mới.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                >
                    {showForm ? 'Đóng' : '+ Đề xuất mới'}
                </button>
            </div>

            {showForm && (
                <CategoryRequestForm mode="create" onSuccess={() => setShowForm(false)} />
            )}

            <MyCategoryRequestList />
        </div>
    );
}