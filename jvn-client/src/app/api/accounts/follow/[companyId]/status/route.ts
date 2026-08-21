import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
    const { companyId } = await params
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/accounts/follow/${companyId}/status/`,
            accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}
        )
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Fetch failed" },
            { status: err.response?.status || 500 }
        )
    }
}