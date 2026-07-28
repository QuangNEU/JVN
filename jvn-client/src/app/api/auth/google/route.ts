import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";
export async function POST(request: NextRequest) {
    const body = await request.json()
    try {
        const djangoRes = await axios.post(`${process.env.API_URL}/accounts/google-login/`,
            body
        )
        const { access, refresh, ...user } = djangoRes.data
        const response = NextResponse.json({ user })
        response.cookies.set(AUTH_KEYS.ACCESS_TOKEN, access, {
            httpOnly: true,
            secure: process.env.NODE_ENV == "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 15
        })
        response.cookies.set(AUTH_KEYS.REFRESH_TOKEN, refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV == "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7
        })
        response.cookies.set(AUTH_KEYS.USER_ROLE, user.role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        })
        return response
    }
    catch (err: any) {
        const status = err.response?.status || 500
        const error = err.response?.data?.error || "Login failed"
        return NextResponse.json(
            { error: error },
            { status }
        )
    }
}