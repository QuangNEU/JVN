import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    const body = await req.json()

    try {
        const danjgoRes = await axios.post(
            `${process.env.API_URL}/accounts/login/`,
            body
        )

        const { access, refresh, ...user } = danjgoRes.data

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
        return response
    } catch (err: any) {
        const status = err.response?.status || 500
        const message = err.response?.data?.error || 'Login failed'
        return NextResponse.json({ error: message }, { status })
    }
}