import PendingReviewWidget from "@/features/accounts/components/PendingReviewWidget";

export default function AdminDashboardPage() {

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
            <p className="mt-1 text-sm text-slate-500">Chào mừng quay trở lại, quản trị viên.</p>
            <div className="mt-3">
                <PendingReviewWidget />
            </div>
        </div>
    );
}