import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";


export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Havent login yet' }, { status: 401 })
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/accounts/profile/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data },
            { status: err.response?.status || 500 }
        )
    }

}

export async function PATCH(request: NextRequest) {
    const accessToken = request.cookies.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Havent login yet' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const djangoRes = await axios.patch(`${process.env.API_URL}/accounts/profile/`, body, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })

        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data },
            { status: err.response?.status || 500 }
        )
    }
}