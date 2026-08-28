import PendingReviewWidget from "@/features/accounts/components/PendingReviewWidget";
import JobConversionFunnelWidget from "@/features/companines/components/JobConversionFunnelWidget";
import SystemOverviewWidget from "@/features/companines/components/SystemOverviewWidget";

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col gap-8 pb-8">

            <div>
                <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
                <p className="mt-1 text-sm text-slate-500">Chào mừng quay trở lại, quản trị viên.</p>
            </div>

            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium text-slate-800">Công việc</h2>
                <PendingReviewWidget />
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-medium text-slate-800">Thống kê</h2>
                <SystemOverviewWidget />
            </section>


            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JobConversionFunnelWidget />
            </section>

        </div>
    );
}