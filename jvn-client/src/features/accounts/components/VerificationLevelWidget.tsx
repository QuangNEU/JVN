// features/accounts/components/VerificationLevelWidget.tsx
'use client';

import { ShieldCheck } from 'lucide-react';
import { useMyVerificationStatus } from '../hooks/useVerification';

export default function VerificationLevelWidget() {
    const { data, isLoading } = useMyVerificationStatus();

    if (isLoading || !data) return null;

    const level = data.verification_level;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        Cấp độ xác thực: {level}/3
                    </p>
                    <p className="text-xs text-slate-500">
                        {level >= 3
                            ? 'Tài khoản đã xác thực đầy đủ.'
                            : 'Đủ điều kiện đăng tin tuyển dụng.'}
                    </p>
                </div>
            </div>
        </div>
    );
}