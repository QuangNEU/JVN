'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Building2, Globe, Calendar, Hash, Briefcase, MapPin, Pencil, Save, X } from 'lucide-react';
import { HEADCOUNT_OPTIONS } from '@/features/accounts/types/company';
import { useMyProfile, useUpdateProfile } from '@/features/accounts/hooks/useProfile';
import { CompanyProfile } from '@/features/accounts/types/account'; // Import thêm type này

export default function CompanyProfilePage() {
    // 1. Đổi tên biến thành account cho đúng bản chất
    const { data: account, isLoading } = useMyProfile();
    const updateMutation = useUpdateProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<Partial<CompanyProfile>>({});

    // 2. Thêm state và ref để xử lý upload ảnh logo
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (isLoading) return <p className="text-sm text-slate-400">Đang tải...</p>;
    if (!account) return null;

    // 3. Tách profile ra khỏi account và ép kiểu
    const profile = account.profile as CompanyProfile;

    const startEdit = () => {
        setForm({ ...profile });
        setIsEditing(true);
    };

    // Hàm xử lý chọn ảnh
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        // Đóng gói thành FormData thay vì JSON thường để gửi được ảnh
        const formData = new FormData();

        Object.keys(form).forEach(key => {
            const value = form[key as keyof CompanyProfile];
            if (value !== undefined && value !== null) {
                formData.append(key, value as string);
            }
        });

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        await updateMutation.mutateAsync(formData);
        setIsEditing(false);
        setLogoFile(null);
    };

    // 4. Biến này dùng để hiển thị dữ liệu linh hoạt (lấy từ form khi sửa, lấy từ db khi xem)
    const displayData = isEditing ? form : profile;
    const previewLogo = logoFile ? URL.createObjectURL(logoFile) : displayData?.logo;

    return (
        <div className="mx-auto max-w-4xl mt-4">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-6">
                <div className="flex items-center gap-4">
                    {/* Khu vực hiển thị và chọn Logo */}
                    <div
                        className={`flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 relative group ${isEditing ? 'cursor-pointer' : ''}`}
                        onClick={() => isEditing && fileInputRef.current?.click()}
                    >
                        {previewLogo ? (
                            <Image src={previewLogo} alt={account.name} width={80} height={80} className="object-cover h-full w-full" />
                        ) : (
                            <Building2 className="h-8 w-8 text-slate-300" />
                        )}

                        {/* Overlay hiện lên khi bấm chỉnh sửa */}
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    <div>
                        {/* Tên lấy từ account, các thông tin khác lấy từ displayData */}
                        <h1 className="text-xl font-bold text-slate-800">{account.name}</h1>
                        {displayData?.website && (
                            <a href={displayData.website} target="_blank" className="mt-1 flex items-center gap-1.5 text-sm text-amber-600 hover:underline">
                                <Globe className="h-3.5 w-3.5" /> {displayData.website}
                            </a>
                        )}
                        <p className="mt-1 text-sm text-slate-400">{displayData?.followers_count || 0} người theo dõi</p>
                    </div>
                </div>

                {!isEditing ? (
                    <button
                        onClick={startEdit}
                        className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                        <Pencil className="h-4 w-4" /> Chỉnh sửa
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setLogoFile(null);
                            }}
                            className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <X className="h-4 w-4" /> Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" /> Lưu
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Giới thiệu */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 md:col-span-2">
                    <h2 className="mb-4 text-base font-bold text-slate-800">Giới thiệu công ty</h2>
                    {isEditing ? (
                        <textarea
                            rows={8}
                            value={displayData?.description || ''}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Giới thiệu về công ty của bạn..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500"
                        />
                    ) : (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                            {displayData?.description || 'Chưa có mô tả'}
                        </p>
                    )}
                </div>

                {/* Thông tin chung */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6">
                    <h2 className="mb-4 text-base font-bold text-slate-800">Thông tin chung</h2>
                    <div className="space-y-4 text-sm">
                        <InfoRow icon={Calendar} label="Ngày thành lập">
                            {isEditing ? (
                                <input
                                    type="date"
                                    max="2026-12-31" // Giới hạn không cho chọn tương lai
                                    value={displayData?.founded_date || ''}
                                    onChange={(e) => setForm({ ...form, founded_date: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                />
                            ) : (
                                // Hiển thị ngày tháng theo chuẩn Việt Nam (DD/MM/YYYY) khi ở chế độ xem
                                displayData?.founded_date
                                    ? new Date(displayData.founded_date).toLocaleDateString('vi-VN')
                                    : '—'
                            )}
                        </InfoRow>
                        <InfoRow icon={Hash} label="Mã số thuế">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={displayData?.tax_code || ''}
                                    onChange={(e) => setForm({ ...form, tax_code: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                />
                            ) : (
                                displayData?.tax_code || '—'
                            )}
                        </InfoRow>

                        <InfoRow icon={Building2} label="Quy mô">
                            {isEditing ? (
                                <select
                                    value={displayData?.headcount || ''}
                                    onChange={(e) => setForm({ ...form, headcount: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                >
                                    <option value="">Chọn quy mô</option>
                                    {HEADCOUNT_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            ) : (
                                HEADCOUNT_OPTIONS.find((o) => o.value === displayData?.headcount)?.label || '—'
                            )}
                        </InfoRow>

                        <InfoRow icon={Briefcase} label="Lĩnh vực hoạt động">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={displayData?.industry || ''}
                                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                />
                            ) : (
                                displayData?.industry || '—'
                            )}
                        </InfoRow>

                        <InfoRow icon={MapPin} label="Địa chỉ">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text" placeholder="Tỉnh/Thành phố"
                                        value={displayData?.province || ''}
                                        onChange={(e) => setForm({ ...form, province: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                    />
                                    <input
                                        type="text" placeholder="Quận/Huyện"
                                        value={displayData?.ward || ''}
                                        onChange={(e) => setForm({ ...form, ward: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                    />
                                    <input
                                        type="text" placeholder="Địa chỉ chi tiết"
                                        value={displayData?.exact_address || ''}
                                        onChange={(e) => setForm({ ...form, exact_address: e.target.value })}
                                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-amber-500"
                                    />
                                </div>
                            ) : (
                                displayData?.exact_address ? `${displayData?.exact_address} ` : `${displayData?.ward}, ${displayData?.province}`
                            )}
                        </InfoRow>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex-1">
                <p className="text-xs text-slate-400">{label}</p>
                <div className="mt-0.5 font-medium text-slate-700">{children}</div>
            </div>
        </div>
    );
}