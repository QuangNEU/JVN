"use client"

import React, { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"


export default function AuthIniitalizer({ children }: { children: React.ReactNode }) {
    const restoreSession = useAuthStore((s) => s.restoreSession)
    const pathname = usePathname();

    useEffect(() => {
        const publicRoutes = ['/login', '/register', '/forgot-password', '/auth/refresh'];
        if (!publicRoutes.includes(pathname)) {
            restoreSession();
        }
    }, [restoreSession, pathname])
    return <>{children}</>
}