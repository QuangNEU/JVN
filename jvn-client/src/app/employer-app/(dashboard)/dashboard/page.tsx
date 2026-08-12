import { Briefcase, Users, Eye, TrendingUp } from 'lucide-react';

const stats = [
    { label: 'Tin đang tuyển', value: '2', icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
    { label: 'Tổng ứng viên', value: '45', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Lượt xem tin', value: '1,204', icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Tỷ lệ phù hợp', value: '68%', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
];

export default function DashboardPage() {
    return (
        <>
            <div>
                <h1 className="mb-1 text-2xl font-bold text-slate-800">Tổng quan</h1>
                <p className="mb-6 text-sm text-slate-500">Chào mừng quay trở lại!</p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5">
                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}>
                                <s.icon className="h-5 w-5" />
                            </span>
                            <p className="mt-4 text-2xl font-bold text-slate-800">{s.value}</p>
                            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>

    );
}