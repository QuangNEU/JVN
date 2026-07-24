import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function POST(req: NextRequest) {
    const body = await req.json()
    const hostname = req.headers.get('host') || '';
    const isEmployerDomain = hostname.startsWith('tuyendung.');

    try {
        const danjgoRes = await axios.post(
            `${process.env.API_URL}/accounts/login/`,
            body
        )

        const { access, refresh, ...user } = danjgoRes.data

        if (isEmployerDomain && user.role !== 'COMPANY') {
            return NextResponse.json(
                { error: 'Vui lòng đăng nhập tại jvn.local dành cho ứng viên' },
                { status: 403 }
            );
        }
        if (!isEmployerDomain && user.role === 'COMPANY') {
            return NextResponse.json(
                { error: 'Vui lòng đăng nhập tại tuyendung.jvn.local dành cho nhà tuyển dụng' },
                { status: 403 }
            );
        }

        const response = NextResponse.json({ user })

        response.cookies.set("refreshToken", refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7
        })

        response.cookies.set("accessToken", access, {
            httpOnly: true,
            secure: process.env.NODE_ENV == 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15
        })
        response.cookies.set(AUTH_KEYS.USER_ROLE, user.role, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
        });
        return response
    } catch (err: any) {
        const status = err.response?.status || 500
        const message = err.response?.data?.error || 'Login failed'
        return NextResponse.json({ error: message }, { status })
    }
}