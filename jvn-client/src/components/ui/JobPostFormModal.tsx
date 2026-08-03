'use client';

import { X } from 'lucide-react';
import { useCreateJobPost } from '@/features/jobs/hooks/useCreateJobPost';
import JobPostFormFields from './JobPostFormField';
import { JobPostFormData } from '@/features/jobs/types/jobs';

export default function JobPostFormModal({
    isOpen, onClose,
}: { isOpen: boolean; onClose: () => void }) {
    const createMutation = useCreateJobPost();

    if (!isOpen) return null;

    const handleCreate = async (data: JobPostFormData) => {
        await createMutation.mutateAsync(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">Đăng tin tuyển dụng mới</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <JobPostFormFields
                        onSubmit={handleCreate}
                        onCancel={onClose}
                        submitLabel="Đăng tin"
                        submittingLabel="Đang đăng..."
                        isSubmitting={createMutation.isPending}
                    />
                </div>
            </div>
        </div>
    );
}