// app/seeker-app/(main)/verify-email/page.tsx
import { Suspense } from 'react';
import VerifyEmailContent from '@/features/accounts/components/VerifyEmailContent';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}