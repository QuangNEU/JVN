import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams.toString();
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/applications/check-applied/bulk/${searchParams ? '?' + searchParams : ''}`,
            accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined);
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to check applications' },
            { status: error.response?.status || 500 }
        );
    }
}