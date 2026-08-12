'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useSubmitBusinessCert } from '../hooks/useVerification';

export default function BusinessCertUploadForm({ onDone }: { onDone?: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const mutation = useSubmitBusinessCert();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Vui lòng chọn file');
            return;
        }
        setError('');
        try {
            await mutation.mutateAsync(file);
            onDone?.();
        } catch (err: any) {
            setError(err.response?.data?.file?.[0] || err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-center hover:border-amber-400">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm text-slate-500">
                    {file ? file.name : 'Chọn file PDF, DOC, DOCX, JPG hoặc PNG (tối đa 5MB)'}
                </span>
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={mutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
            >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {mutation.isPending ? 'Đang nộp...' : 'Nộp giấy chứng nhận'}
            </button>
        </form>
    );
}