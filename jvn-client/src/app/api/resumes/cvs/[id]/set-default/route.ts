import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = await cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const { id } = await params
    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        )
    }

    try {
        const djangoRes = await axios.post(`${process.env.API_URL}/resumes/cv/${id}/set-default/`, {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to update job post detail' },
            { status: err.response?.status || 500 }
        )
    }
}