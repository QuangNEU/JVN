'use client';

import { useState } from 'react';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyApplications } from '@/features/applications/hooks/useMyApplication';
import ApplicationCard from '@/components/ui/ApplicationCard';
import { STATUS_FILTER_TABS } from '@/constants/application';
import { ApplicationStatus } from '@/features/applications/types/application';

export default function MyApplicationsPage() {
    const [activeTab, setActiveTab] = useState<ApplicationStatus | 'ALL'>('ALL');
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useMyApplications({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page,
    });

    const handleTabChange = (tab: ApplicationStatus | 'ALL') => {
        setActiveTab(tab);
        setPage(1);
    };

    return (
        <div className="bg-slate-50 pb-16">
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                <h1 className="text-xl font-bold text-slate-800">Việc làm đã ứng tuyển</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái các hồ sơ bạn đã gửi.</p>

                {/* Tabs filter theo status */}
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                    {STATUS_FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.value
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Nội dung */}
                <div className="mt-5 space-y-3">
                    {isLoading ? (
                        <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-400">
                            Đang tải...
                        </div>
                    ) : isError ? (
                        <div className="rounded-2xl border border-dashed border-red-200 bg-white py-12 text-center text-sm text-red-500">
                            Không tải được danh sách. Vui lòng thử lại.
                        </div>
                    ) : !data || data.results.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                            <Inbox className="h-8 w-8 text-slate-300" />
                            <p className="text-sm text-slate-500">Bạn chưa ứng tuyển việc làm nào ở trạng thái này.</p>
                        </div>
                    ) : (
                        data.results.map((application) => (
                            <ApplicationCard key={application.id} application={application} />
                        ))
                    )}
                </div>

                {/* Phân trang đơn giản dựa trên next/previous */}
                {data && (data.next || data.previous) && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!data.previous}
                            className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" /> Trước
                        </button>
                        <span className="text-sm text-slate-500">Trang {page}</span>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!data.next}
                            className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Sau <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}