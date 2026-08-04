"use client";

import { useState } from "react";
import { useCVs } from "@/features/resumes/hooks/useCVs";
import { CV } from "@/features/resumes/types/cv";
import CVCard from "./CvCard";
import CVFormModal from "./CvFormModal";

export default function CVList() {
    const { data: cvs, isLoading, isError } = useCVs();
    const [editingCV, setEditingCV] = useState<CV | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const showModal = showCreate || !!editingCV;

    function closeModal() {
        setShowCreate(false);
        setEditingCV(null);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Quản lý CV</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Thêm nhiều CV cho từng vị trí, chọn 1 CV mặc định để ứng tuyển nhanh.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    + Thêm CV mới
                </button>
            </div>

            {isLoading && (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                </div>
            )}

            {isError && (
                <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                    Không tải được danh sách CV. Vui lòng thử lại sau.
                </div>
            )}

            {!isLoading && !isError && cvs && cvs.length === 0 && (
                <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
                    <p className="font-medium text-slate-600">Bạn chưa có CV nào</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Tải lên CV đầu tiên để bắt đầu ứng tuyển.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Thêm CV mới
                    </button>
                </div>
            )}

            {!isLoading && !isError && cvs && cvs.length > 0 && (
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cvs.map((cv) => (
                        <CVCard key={cv.id} cv={cv} onEdit={setEditingCV} />
                    ))}
                </div>
            )}

            {showModal && <CVFormModal cv={editingCV} onClose={closeModal} />}
        </div>
    );
}