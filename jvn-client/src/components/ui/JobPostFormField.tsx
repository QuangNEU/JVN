'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTags } from '@/features/resumes/hooks/useTag';
import { useApprovedCategories } from '@/features/jobs/hooks/useCategory';
import { JobPostFormData, JobLevelType, JobTypeType } from '@/features/jobs/types/jobs';
import CategoryCheckboxTree from '@/features/jobs/components/CategoryCheckboxTree';

const typeOptions: { value: JobTypeType; label: string }[] = [
    { value: 'FULLTIME', label: 'Toàn thời gian' },
    { value: 'PARTTIME', label: 'Bán thời gian' },
    { value: 'HYBRID', label: 'Hỗn hợp' },
    { value: 'REMOTE', label: 'Làm việc từ xa' },
];

const levelOptions: { value: JobLevelType; label: string }[] = [
    { value: 'INTERN', label: 'Intern' },
    { value: 'FRESHER', label: 'Fresher' },
    { value: 'JUNIOR', label: 'Junior' },
    { value: 'SENIOR', label: 'Senior' },
];

const emptyForm: JobPostFormData = {
    title: '',
    descriptions: '',
    requirement: '',
    benefit: '',
    type: 'FULLTIME',
    level: 'JUNIOR',
    experience_requirement: '',
    headcount: 1,
    currency: 'VND',
    is_negotiable: false,
    expiration_date: '',
    tag_ids: [],
    category_ids: [],
};

interface JobPostFormFieldsProps {
    initialValues?: JobPostFormData;
    onSubmit: (data: JobPostFormData) => Promise<void>;
    onCancel: () => void;
    submitLabel: string;
    submittingLabel: string;
    isSubmitting: boolean;
}

export default function JobPostFormFields({
    initialValues,
    onSubmit,
    onCancel,
    submitLabel,
    submittingLabel,
    isSubmitting,
}: JobPostFormFieldsProps) {
    const [form, setForm] = useState<JobPostFormData>(initialValues ?? emptyForm);
    const [error, setError] = useState('');
    const [isTagOpen, setIsTagOpen] = useState(false);
    const tagRef = useRef<HTMLDivElement>(null);

    const { data: tags } = useTags();
    const { data: categories } = useApprovedCategories();

    // nếu initialValues đến muộn hơn (vd đang fetch job detail), đồng bộ lại form khi có data
    useEffect(() => {
        if (initialValues) setForm(initialValues);
    }, [JSON.stringify(initialValues)]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tagRef.current && !tagRef.current.contains(e.target as Node)) {
                setIsTagOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const update = (field: keyof JobPostFormData, value: any) =>
        setForm((f) => ({ ...f, [field]: value }));

    const toggleTag = (id: number) => {
        setForm((f) => ({
            ...f,
            tag_ids: f.tag_ids.includes(id) ? f.tag_ids.filter((t) => t !== id) : [...f.tag_ids, id],
        }));
    };

    const toggleCategory = (id: number) => {
        setForm((f) => ({
            ...f,
            category_ids: f.category_ids.includes(id) ? f.category_ids.filter((c) => c !== id) : [...f.category_ids, id],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError('');

        if (!form.is_negotiable && form.salary_min && form.salary_max && form.salary_min > form.salary_max) {
            setError('Lương tối thiểu không được lớn hơn lương tối đa');
            return;
        }

        try {
            await onSubmit({
                ...form,
                expiration_date: form.expiration_date ? form.expiration_date : undefined,
            });
        } catch (err: any) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên vị trí *</label>
                <input
                    type="text" required value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="VD: Backend Developer (NodeJS)"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Loại hình *</label>
                    <select
                        value={form.type} onChange={(e) => update('type', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                        {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Cấp bậc *</label>
                    <select
                        value={form.level} onChange={(e) => update('level', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                        {levelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Kinh nghiệm yêu cầu *</label>
                    <input
                        type="text" required value={form.experience_requirement}
                        onChange={(e) => update('experience_requirement', e.target.value)}
                        placeholder="VD: 2 năm kinh nghiệm"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                </div>
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Số lượng cần tuyển *</label>
                    <input
                        type="number" required min={1} value={form.headcount}
                        onChange={(e) => update('headcount', Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                    />
                </div>
            </div>

            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Mức lương</label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox" checked={form.is_negotiable}
                            onChange={(e) => update('is_negotiable', e.target.checked)}
                            className="rounded"
                        />
                        Thỏa thuận
                    </label>
                </div>
                {!form.is_negotiable && (
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number" placeholder="Từ" value={form.salary_min || ''}
                            onChange={(e) => update('salary_min', Number(e.target.value))}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                        />
                        <input
                            type="number" placeholder="Đến" value={form.salary_max || ''}
                            onChange={(e) => update('salary_max', Number(e.target.value))}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                        />
                        <select
                            value={form.currency} onChange={(e) => update('currency', e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                        >
                            <option value="VND">VND</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                )}
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mô tả công việc *</label>
                <textarea
                    rows={4} required value={form.descriptions}
                    onChange={(e) => update('descriptions', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Yêu cầu ứng viên *</label>
                <textarea
                    rows={4} required value={form.requirement}
                    onChange={(e) => update('requirement', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
            </div>
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Quyền lợi</label>
                <textarea
                    rows={3} value={form.benefit}
                    onChange={(e) => update('benefit', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
            </div>

            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hạn nộp hồ sơ</label>
                <input
                    type="date" value={form.expiration_date}
                    onChange={(e) => update('expiration_date', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-500"
                />
            </div>

            {/* Tags - dropdown multi-select */}
            <div ref={tagRef} className="relative">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Kỹ năng yêu cầu</label>
                <button
                    type="button"
                    onClick={() => setIsTagOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm outline-none focus:border-amber-500"
                >
                    <span className={form.tag_ids.length ? 'text-slate-700' : 'text-slate-400'}>
                        {form.tag_ids.length > 0 ? `Đã chọn ${form.tag_ids.length} kỹ năng` : 'Chọn kỹ năng...'}
                    </span>
                    <svg className={`h-4 w-4 text-slate-400 transition-transform ${isTagOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isTagOpen && (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        {tags && tags.length > 0 ? (
                            tags.map((tag) => (
                                <label key={tag.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={form.tag_ids.includes(tag.id)}
                                        onChange={() => toggleTag(tag.id)}
                                        className="rounded"
                                    />
                                    {tag.tag_name}
                                </label>
                            ))
                        ) : (
                            <p className="px-3 py-2 text-sm text-slate-400">Không có kỹ năng nào</p>
                        )}
                    </div>
                )}

                {form.tag_ids.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {tags?.filter((t) => form.tag_ids.includes(t.id)).map((tag) => (
                            <span key={tag.id} className="flex items-center gap-1 rounded-full border border-amber-500 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                                {tag.tag_name}
                                <button type="button" onClick={() => toggleTag(tag.id)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Categories */}
            {categories && categories.length > 0 && (
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Danh mục ngành nghề</label>
                    <p className="mb-2 text-xs text-slate-400">
                        Chọn vị trí cụ thể — không chọn được nhóm ngành lớn
                    </p>
                    <CategoryCheckboxTree
                        categories={categories}
                        selectedIds={form.category_ids}
                        onChange={(ids) => update('category_ids', ids)}
                        mode="leaf-only"
                        accentClassName="bg-amber-500"
                    />
                </div>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                    type="button" onClick={onCancel}
                    className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                    Hủy
                </button>
                <button
                    type="submit" disabled={isSubmitting}
                    className="rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
                >
                    {isSubmitting ? submittingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
}