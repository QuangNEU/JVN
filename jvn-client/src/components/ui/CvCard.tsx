"use client";

import { useState } from "react";
import { CV, CV_LEVEL_LABELS } from "@/features/resumes/types/cv";
import { useDeleteCV, useSetDefaultCV } from "@/features/resumes/hooks/useCVs";
import CVPreviewModal from "./CvPreviewModal";

interface Props {
    cv: CV;
    onEdit: (cv: CV) => void;
}

export default function CVCard({ cv, onEdit }: Props) {
    const [showPreview, setShowPreview] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const setDefaultMutation = useSetDefaultCV();
    const deleteMutation = useDeleteCV();

    const isBusy = setDefaultMutation.isPending || deleteMutation.isPending;

    return (
        <>
            <div className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                {cv.is_default && (
                    <span className="absolute -top-2 left-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white shadow">
                        CV mặc định
                    </span>
                )}

                <div className="mt-2 flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 font-semibold text-slate-800">{cv.title}</h3>
                    <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {CV_LEVEL_LABELS[cv.level]}
                    </span>
                </div>

                {cv.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {cv.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                            >
                                {tag.tag_name}
                            </span>
                        ))}
                    </div>
                )}

                <p className="mt-3 text-xs text-slate-400">
                    Cập nhật: {new Date(cv.updated_at).toLocaleDateString("vi-VN")}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                        Xem CV
                    </button>
                    <button
                        onClick={() => onEdit(cv)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                        Sửa
                    </button>
                    {!cv.is_default && (
                        <button
                            disabled={isBusy}
                            onClick={() => setDefaultMutation.mutate(cv.id)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                            Đặt làm mặc định
                        </button>
                    )}
                    <button
                        disabled={isBusy}
                        onClick={() => setConfirmDelete(true)}
                        className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                        Xóa
                    </button>
                </div>
            </div>

            {showPreview && (
                <CVPreviewModal cv={cv} onClose={() => setShowPreview(false)} />
            )}

            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
                        <h4 className="font-semibold text-slate-800">Xóa CV này?</h4>
                        <p className="mt-1 text-sm text-slate-500">
                            "{cv.title}" sẽ bị xóa vĩnh viễn và không thể khôi phục.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(cv.id, { onSuccess: () => setConfirmDelete(false) })}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}