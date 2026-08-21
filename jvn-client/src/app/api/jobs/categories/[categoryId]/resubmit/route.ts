import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const id = await (await params).categoryId

    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json()
        const djangoRes = await axios.patch(
            `${process.env.API_URL}/jobs/category/${id}/resubmit/`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )

        return NextResponse.json(djangoRes.data)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Resubmit category failed' },
            { status: error.response?.status || 500 }
        );
    }
}