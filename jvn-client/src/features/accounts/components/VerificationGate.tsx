'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Mail, FileWarning, Loader2 } from 'lucide-react';
import { useMyVerificationStatus, useSendEmailVerification } from '../hooks/useVerification';
import BusinessCertUploadForm from './BusinessCertUploadForm';

export default function VerificationGate({ children }: { children: React.ReactNode }) {
    const { data, isLoading } = useMyVerificationStatus();
    const sendEmailMutation = useSendEmailVerification();
    const [sent, setSent] = useState(false);

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    if (!data || data.verification_level >= 2) {
        return <>{children}</>;
    }

    const handleResend = () => {
        sendEmailMutation.mutate(undefined, { onSuccess: () => setSent(true) });
    };

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-slate-800">Tài khoản chưa đủ điều kiện sử dụng</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Hoàn thành các bước sau để tiếp tục sử dụng hệ thống:
                        </p>

                        <div className="mt-5 space-y-4">
                            <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
                                {data.email_verified ? (
                                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                ) : (
                                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${data.email_verified ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                                        Bước 1 · Xác thực email
                                    </p>
                                    {!data.email_verified && (
                                        <>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Chúng tôi đã gửi link xác thực tới email của bạn. Kiểm tra hộp thư (kể cả mục Spam).
                                            </p>
                                            <button
                                                onClick={handleResend}
                                                disabled={sendEmailMutation.isPending || sent}
                                                className="mt-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                                            >
                                                {sendEmailMutation.isPending ? 'Đang gửi...' : sent ? 'Đã gửi lại, kiểm tra email' : 'Gửi lại email xác thực'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-100 p-4">
                                <div className="flex items-start gap-3">
                                    {data.business_cert_status === 'APPROVED' ? (
                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                                    ) : (
                                        <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                    )}
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${data.business_cert_status === 'APPROVED' ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                                            Bước 2 · Giấy chứng nhận đăng ký doanh nghiệp
                                            {data.business_cert_status === 'PENDING' && ' (đang chờ duyệt)'}
                                        </p>
                                        {data.business_cert_status === 'REJECTED' && data.business_cert_rejected_reason && (
                                            <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                                Lý do bị từ chối: {data.business_cert_rejected_reason}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {data.business_cert_status !== 'APPROVED' && data.business_cert_status !== 'PENDING' && (
                                    <div className="mt-3">
                                        <BusinessCertUploadForm />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}