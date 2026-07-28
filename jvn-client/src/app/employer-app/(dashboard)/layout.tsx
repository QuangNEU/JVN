'use client'
import { useState } from 'react';
import CompanySidebar from "@/components/layout/CompanySidebar";
import CompanyTopBar from "@/components/layout/CompanyTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex min-h-screen bg-slate-50 ">
            <div className="min-h-screen bg-slate-50 w-full">
                <CompanyTopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
                <div className="flex">
                    <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <main className="flex-1 p-8 lg:ml-0">{children}</main>
                </div>
            </div>
        </div>
    );
}