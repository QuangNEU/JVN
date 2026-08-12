'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useConfirmEmailVerification } from '../hooks/useVerification';

type Status = 'loading' | 'success' | 'error';


export default function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const confirmMutation = useConfirmEmailVerification();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Thiếu token xác thực trong đường link.');
            return;
        }
        confirmMutation.mutate(token, {
            onSuccess: (data) => {
                setStatus('success');
                setMessage(data.message || 'Xác thực email thành công.');
            },
            onError: (err: any) => {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Link xác thực không hợp lệ hoặc đã hết hạn.');
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
                {status === 'loading' && (
                    <>
                        <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
                        <p className="mt-4 text-sm text-slate-500">Đang xác thực email...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                        <h1 className="mt-4 text-lg font-bold text-slate-800">Xác thực thành công</h1>
                        <p className="mt-2 text-sm text-slate-500">{message}</p>
                        <Link href="/login" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
                            Đăng nhập ngay
                        </Link>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h1 className="mt-4 text-lg font-bold text-slate-800">Xác thực thất bại</h1>
                        <p className="mt-2 text-sm text-slate-500">{message}</p>
                    </>
                )}
            </div>
        </div>
    );
}