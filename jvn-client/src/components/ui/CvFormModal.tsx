"use client";

import { useState } from "react";
import { CV, CV_LEVELS, CV_LEVEL_LABELS, CVFormPayload, CVLevel } from "@/features/resumes/types/cv";
import { useCreateCV, useUpdateCV } from "@/features/resumes/hooks/useCVs";
import { useTags } from "@/features/resumes/hooks/useTag";

interface Props {
    cv: CV | null; // null = tạo mới, có giá trị = sửa
    onClose: () => void;
}

const MAX_FILE_MB = 5;

export default function CVFormModal({ cv, onClose }: Props) {
    const isEditing = !!cv;
    const { data: tags = [] } = useTags();
    const createMutation = useCreateCV();
    const updateMutation = useUpdateCV();

    const [title, setTitle] = useState(cv?.title ?? "");
    const [level, setLevel] = useState<CVLevel>(cv?.level ?? "FRESHER");
    const [tagIds, setTagIds] = useState<number[]>(cv?.tags.map((t) => t.id) ?? []);
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    function toggleTag(id: number) {
        setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        if (f && f.type !== "application/pdf") {
            setFileError("Chỉ chấp nhận file PDF.");
            setFile(null);
            return;
        }
        if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
            setFileError(`File tối đa ${MAX_FILE_MB}MB.`);
            setFile(null);
            return;
        }
        setFileError(null);
        setFile(f);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Chặn double-submit
        if (isSubmitting) return;

        if (!title.trim()) return;
        if (!isEditing && !file) {
            setFileError("Vui lòng chọn file CV (PDF).");
            return;
        }

        const payload: CVFormPayload = { title: title.trim(), level, tag_ids: tagIds, file };

        if (isEditing) {
            updateMutation.mutate({ id: cv.id, payload }, { onSuccess: onClose });
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            >
                <h3 className="text-lg font-semibold text-slate-800">
                    {isEditing ? "Sửa CV" : "Thêm CV mới"}
                </h3>

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Tên CV</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VD: CV Frontend Developer"
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Trình độ</label>
                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value as CVLevel)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {CV_LEVELS.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    {CV_LEVEL_LABELS[lvl]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Kỹ năng / Tag</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => {
                                const active = tagIds.includes(tag.id);
                                return (
                                    <button
                                        type="button"
                                        key={tag.id}
                                        onClick={() => toggleTag(tag.id)}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-300 bg-white text-slate-600 hover:border-blue-400"
                                            }`}
                                    >
                                        {tag.tag_name}
                                    </button>
                                );
                            })}
                            {tags.length === 0 && (
                                <p className="text-xs text-slate-400">Chưa có tag nào.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                            File CV (PDF) {isEditing && <span className="text-slate-400">— để trống nếu giữ nguyên</span>}
                        </label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
                        />
                        {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
                        {isEditing && !file && (
                            <p className="mt-1 text-xs text-slate-400">File hiện tại: {cv.file.split("/").pop()}</p>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo CV"}
                    </button>
                </div>
            </form>
        </div>
    );
}