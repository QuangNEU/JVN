import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_KEYS } from "@/constants/auth";



export async function POST(request: NextRequest) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const body = await request.json()
    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        )
    }
    try {
        const djangoRes = await axios.post(`${process.env.API_URL}/jobs/jobposts/`, body, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Created failed' },
            { status: err.response?.status || 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        )
    }
    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/jobs/jobposts/${request.nextUrl.search}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Get job posts failed' },
            { status: err.response?.status || 500 }
        );
    }
}
