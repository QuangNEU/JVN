import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        );
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/chats/ws-ticket/`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to get ws ticket' },
            { status: err.response?.status || 500 }
        );
    }
}