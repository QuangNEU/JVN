'use client';

import { useRouter, useParams } from 'next/navigation';
import { useJobPostDetail, useUpdateJobPost } from '@/features/jobs/hooks/useCompanyJobs';
import JobPostFormFields from '@/components/ui/JobPostFormField';
import { JobPost, JobPostFormData } from '@/features/jobs/types/jobs';

function jobPostToFormData(job: JobPost): JobPostFormData {
    return {
        title: job.title,
        descriptions: job.descriptions,
        requirement: job.requirement,
        benefit: job.benefit ?? '',
        type: job.type,
        level: job.level,
        experience_requirement: job.experience_requirement,
        headcount: job.headcount,
        salary_min: job.salary_min ? Number(job.salary_min) : undefined,
        salary_max: job.salary_max ? Number(job.salary_max) : undefined,
        currency: job.currency,
        is_negotiable: job.is_negotiable,
        expiration_date: job.expiration_date ? job.expiration_date.slice(0, 10) : '',
        tag_ids: job.tags.map((t) => t.id),
        category_ids: job.category.map((c) => c.id),
    };
}

export default function EditJobPostPage() {
    const router = useRouter();
    const params = useParams();
    const id = Number(params.id);

    const { data: job, isLoading, isError } = useJobPostDetail(id);
    const updateMutation = useUpdateJobPost();

    const handleUpdate = async (data: JobPostFormData) => {
        await updateMutation.mutateAsync({ id, payload: data });
        router.push('/jobs');
    };

    if (isLoading) {
        return <div className="py-16 text-center text-sm text-slate-400">Đang tải tin tuyển dụng...</div>;
    }

    if (isError || !job) {
        return <div className="py-16 text-center text-sm text-red-500">Không thể tải tin tuyển dụng.</div>;
    }

    return (
        <div className="mx-auto max-w-2xl">
            <h1 className="mb-6 text-2xl font-bold text-slate-800">Chỉnh sửa tin tuyển dụng</h1>
            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
                <JobPostFormFields
                    initialValues={jobPostToFormData(job)}
                    onSubmit={handleUpdate}
                    onCancel={() => router.push('/jobs')}
                    submitLabel="Lưu thay đổi"
                    submittingLabel="Đang lưu..."
                    isSubmitting={updateMutation.isPending}
                />
            </div>
        </div>
    );
}