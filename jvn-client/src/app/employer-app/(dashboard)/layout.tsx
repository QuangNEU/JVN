import CompanySidebar from "@/components/layout/CompanySidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <CompanySidebar />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
    );
}