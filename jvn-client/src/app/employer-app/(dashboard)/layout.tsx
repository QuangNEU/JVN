'use client'
import { useState } from 'react';
import CompanySidebar from "@/components/layout/CompanySidebar";
import CompanyTopBar from "@/components/layout/CompanyTopBar";
import VerificationGate from '@/features/accounts/components/VerificationGate';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex min-h-screen bg-slate-50 ">
            <div className="min-h-screen bg-slate-50 w-full">
                <CompanyTopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
                <div className="flex">
                    <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <main className="flex-1">
                        <VerificationGate>{children}</VerificationGate>
                    </main>
                </div>
            </div>
        </div>
    );
}