"use client";

import { useEffect, useState } from "react";
import { CV } from "@/features/resumes/types/cv";

interface Props {
    cv: CV;
    onClose: () => void;
}

export default function CVPreviewModal({ cv, onClose }: Props) {
    const [failed, setFailed] = useState(false);
    const fileUrl = cv.file
    useEffect(() => {
        const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                    <h3 className="truncate font-semibold text-slate-800">{cv.title}</h3>
                    <div className="flex items-center gap-2">
                        <a
                            href={cv.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                            Mở tab mới
                        </a>
                        <button
                            onClick={onClose}
                            className="rounded-lg px-2 py-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="relative flex-1 bg-slate-50">
                    {!failed ? (
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                            title={cv.title}
                            className="h-full w-full"
                            onError={() => setFailed(true)}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                            <p className="text-slate-500">
                                Không thể xem trước file này ngay trong trình duyệt.
                            </p>
                            <a
                                href={cv.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Mở CV trong tab mới
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}