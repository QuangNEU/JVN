import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { error } from "console";
import { AUTH_KEYS } from "@/constants/auth";
export async function POST(request: NextRequest) {
    const body = await request.json()

    try {
        const djangoResponse = await axios.post(`${process.env.API_URL}/accounts/register/`, body)
        const { access, refresh, ...user } = djangoResponse.data
        const response = NextResponse.json({ user })

        response.cookies.set('accessToken', access, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15
        })

        response.cookies.set('refreshToken', refresh, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 7
        })
        response.cookies.set(AUTH_KEYS.USER_ROLE, user.role, {
            httpOnly: false,   // middleware + client đều cần đọc, role không nhạy cảm
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
        });
        return response;
    }
    catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || err.response?.data || 'Register failed' },
            { status: err.response?.status || 500 }
        )
    }
}