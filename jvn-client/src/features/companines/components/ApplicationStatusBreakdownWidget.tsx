'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useApplicationStatusBreakdown } from '../hooks/useCompanies';

const STATUS_COLOR: Record<string, string> = {
    HIRED: '#10b981',      // emerald-500
    REJECTED: '#f87171',   // red-400
    INTERVIEWING: '#f59e0b', // amber-500
};
const DEFAULT_COLOR = '#94a3b8'; // slate-400

export default function ApplicationStatusBreakdownWidget() {
    const { data, isLoading } = useApplicationStatusBreakdown();

    if (isLoading) return null;

    const items = data ?? [];

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-slate-800">Ứng viên theo trạng thái</p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={items} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {items.map((item) => (
                            <Cell key={item.status} fill={STATUS_COLOR[item.status] ?? DEFAULT_COLOR} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}