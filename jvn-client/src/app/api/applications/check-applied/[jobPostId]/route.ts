import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobPostId: string }> }
) {
    const { jobPostId } = await params;
    const cookiesStore = await cookies()
    const accessToken = await cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/applications/check-applied/${jobPostId}/`,
            accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
        );
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to check application status' },
            { status: error.response?.status || 500 }
        );
    }
}