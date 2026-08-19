import PendingReviewWidget from "@/features/accounts/components/PendingReviewWidget";
import JobConversionFunnelWidget from "@/features/companines/components/JobConversionFunnelWidget";
import SystemOverviewWidget from "@/features/companines/components/SystemOverviewWidget";

export default function AdminDashboardPage() {

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
            <p className="mt-1 text-sm text-slate-500">Chào mừng quay trở lại, quản trị viên.</p>
            <div className="mt-3">
                <PendingReviewWidget />
            </div>
            <div className="mt-3">
                <SystemOverviewWidget />
            </div>
            <div className="mt-3 w-1/2 ">
                <JobConversionFunnelWidget />
            </div>
        </div>
    );
}