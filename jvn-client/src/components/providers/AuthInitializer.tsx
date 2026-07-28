"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer({
    children,
}: {
    children: React.ReactNode;
}) {
    const restoreSession = useAuthStore((state) => state.restoreSession);

    useEffect(() => {
        void restoreSession();
    }, [restoreSession]);

    return <>{children}</>;
}