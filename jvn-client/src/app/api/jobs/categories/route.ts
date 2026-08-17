import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { cookies } from 'next/headers';
import { AUTH_KEYS } from '@/constants/auth';

export async function GET(request: NextRequest) {
    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/jobs/category/public/`
        );
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to fetch categories' },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value

    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json()
        const djangoRes = await axios.post(`${process.env.API_URL}/jobs/category/create/`, body, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to create categories' },
            { status: error.response?.status || 500 }
        );
    }
}