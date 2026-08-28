'use client'
import { useState } from 'react';
import CompanySidebar from "@/components/layout/CompanySidebar";
import CompanyTopBar from "@/components/layout/CompanyTopBar";
import VerificationGate from '@/features/accounts/components/VerificationGate';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <div className="flex flex-col w-full h-full bg-slate-50">
                <CompanyTopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
                <div className="flex flex-1 overflow-hidden">
                    <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                    <main className="flex-1 overflow-y-auto">
                        <div className='m-4'>
                            <VerificationGate>
                                {children}
                            </VerificationGate>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}