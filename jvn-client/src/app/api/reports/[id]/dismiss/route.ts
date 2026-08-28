// app/api/reports/[id]/dismiss/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const body = await request.json()
    const { id } = await params
    if (!accessToken) {
        return NextResponse.json({ error: 'access Token not found' }, { status: 401 });
    }
    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/reports/${id}/dismiss/`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { detail: 'Dismiss failed' },
            { status: err.response?.status || 500 }
        );
    }
}