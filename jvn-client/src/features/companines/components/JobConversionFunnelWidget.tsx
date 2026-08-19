// JobConversionFunnelWidget.tsx
'use client';

import { useJobConversionFunnel } from '../hooks/useAdminDashboard';

export default function JobConversionFunnelWidget() {
    const { data, isLoading } = useJobConversionFunnel();

    if (isLoading || !data) return null;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-800">Tỉ lệ ứng tuyển (Job đã đăng hơn 3 ngày)</p>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-800">{data.conversion_rate}%</span>
                <span className="mb-1 text-xs text-slate-500">job có ít nhất 1 ứng viên</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${data.conversion_rate}%` }}
                />
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>{data.jobs_with_applications} job có CV</span>
                <span>{data.jobs_without_applications} job trắng</span>
            </div>
        </div>
    );
}