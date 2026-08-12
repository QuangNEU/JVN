'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Mail, FileWarning, Loader2 } from 'lucide-react';
import { useMyVerificationStatus, useSendEmailVerification } from '../hooks/useVerification';
import BusinessCertUploadForm from './BusinessCertUploadForm';

export default function VerificationStatusBanner() {
    const { data, isLoading } = useMyVerificationStatus();
    const sendEmailMutation = useSendEmailVerification();
    const [sent, setSent] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    if (isLoading || !data) return null;
    if (data.verification_level >= 2) return null; // đủ điều kiện đăng tin, không cần hiện banner

    const handleResend = () => {
        sendEmailMutation.mutate(undefined, { onSuccess: () => setSent(true) });
    };

    return (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800">Tài khoản chưa đủ điều kiện đăng tin</p>
                    <p className="mt-1 text-sm text-amber-700">
                        Hoàn thành các bước sau để có thể đăng tin tuyển dụng:
                    </p>

                    <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            {data.email_verified ? (
                                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                                <Mail className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            <span className={data.email_verified ? 'text-emerald-700 line-through' : 'text-amber-800'}>
                                Xác thực email
                            </span>
                            {!data.email_verified && (
                                <button
                                    onClick={handleResend}
                                    disabled={sendEmailMutation.isPending || sent}
                                    className="ml-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                                >
                                    {sendEmailMutation.isPending ? 'Đang gửi...' : sent ? 'Đã gửi, kiểm tra email' : 'Gửi email xác thực'}
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            {data.business_cert_status === 'APPROVED' ? (
                                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                                <FileWarning className="h-4 w-4 shrink-0 text-amber-500" />
                            )}
                            <span className={data.business_cert_status === 'APPROVED' ? 'text-emerald-700 line-through' : 'text-amber-800'}>
                                Giấy chứng nhận đăng ký doanh nghiệp
                                {data.business_cert_status === 'PENDING' && ' (đang chờ duyệt)'}
                                {data.business_cert_status === 'REJECTED' && ' (đã bị từ chối)'}
                            </span>
                            {data.business_cert_status !== 'APPROVED' && data.business_cert_status !== 'PENDING' && (
                                <button
                                    onClick={() => setShowUpload(true)}
                                    className="ml-2 text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Nộp giấy chứng nhận
                                </button>
                            )}
                        </div>

                        {data.business_cert_status === 'REJECTED' && data.business_cert_rejected_reason && (
                            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                Lý do từ chối: {data.business_cert_rejected_reason}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showUpload && (
                <div className="mt-4 border-t border-amber-200 pt-4">
                    <BusinessCertUploadForm onDone={() => setShowUpload(false)} />
                </div>
            )}
        </div>
    );
}