'use client';

import { useState } from 'react';
import { useMyProfile, useUpdateProfile } from '@/features/accounts/hooks/useProfile';
import { JobSeekerProfile } from '@/features/accounts/types/account';
import { User, Phone, Link, Pencil, Save, X } from 'lucide-react';

export default function SeekerProfilePage() {
    const { data: account, isLoading } = useMyProfile();
    const updateMutation = useUpdateProfile();

    const [isEditing, setIsEditing] = useState(false);

    // Form lưu trữ cả dữ liệu của Account (name, tel) và Profile (github_urls)
    const [form, setForm] = useState<{
        name?: string;
        tel?: string;
        github_urls?: string;
    }>({});

    if (isLoading) return <p className="text-sm text-slate-400">Đang tải hồ sơ...</p>;
    if (!account) return null;

    // Ép kiểu profile về JobSeekerProfile
    const profile = account.profile as JobSeekerProfile;

    const startEdit = () => {
        // Đổ dữ liệu hiện tại vào form
        setForm({
            name: account.name,
            tel: account.tel,
            github_urls: profile?.github_urls || '',
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        // Gửi thẳng cục form này xuống Backend. 
        // UpdateDetailSerializer và update_my_detail_service của em sẽ tự động bóc tách đúng chỗ!
        await updateMutation.mutateAsync(form);
        setIsEditing(false);
    };

    // Xác định dữ liệu hiển thị (lúc đang sửa thì lấy từ form, lúc xem thì lấy từ account gốc)
    const displayData = {
        name: isEditing ? form.name : account.name,
        tel: isEditing ? form.tel : account.tel,
        github_urls: isEditing ? form.github_urls : profile?.github_urls,
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header / Hành động */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Hồ sơ cá nhân</h1>
                    <p className="text-sm text-slate-500">Quản lý thông tin liên hệ và liên kết của bạn</p>
                </div>

                {!isEditing ? (
                    <button
                        onClick={startEdit}
                        className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                        <Pencil className="h-4 w-4" /> Cập nhật
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <X className="h-4 w-4" /> Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" /> {updateMutation.isPending ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                    </div>
                )}
            </div>

            {/* Form thông tin */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-6">

                {/* Email (Chỉ đọc, không cho sửa) */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email đăng nhập</label>
                    <input
                        type="text"
                        value={account.email}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Họ và tên */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Họ và tên</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                disabled={!isEditing}
                                value={displayData.name || ''}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`w-full rounded-lg border px-4 py-2 pl-10 text-sm outline-none transition-colors 
                                    ${isEditing ? 'border-blue-500 bg-white' : 'border-slate-200 bg-transparent'}`}
                            />
                        </div>
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Số điện thoại</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                disabled={!isEditing}
                                value={displayData.tel || ''}
                                onChange={(e) => setForm({ ...form, tel: e.target.value })}
                                className={`w-full rounded-lg border px-4 py-2 pl-10 text-sm outline-none transition-colors 
                                    ${isEditing ? 'border-blue-500 bg-white' : 'border-slate-200 bg-transparent'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Github URL */}
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Link Github (Dành cho Dev)</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Link className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            disabled={!isEditing}
                            value={displayData.github_urls || ''}
                            onChange={(e) => setForm({ ...form, github_urls: e.target.value })}
                            placeholder="https://github.com/username"
                            className={`w-full rounded-lg border px-4 py-2 pl-10 text-sm outline-none transition-colors 
                                ${isEditing ? 'border-blue-500 bg-white' : 'border-slate-200 bg-transparent'}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}