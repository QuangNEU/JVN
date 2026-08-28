// app/api/reports/admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function GET(request: NextRequest) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value

    if (!accessToken) {
        return NextResponse.json({ error: 'access Token not found' }, { status: 401 });
    }
    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/reports/admin/${request.nextUrl.search}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { detail: 'Failed to fetch reports' },
            { status: err.response?.status || 500 }
        );
    }
}