import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams.toString();
    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/jobs/category/${searchParams ? '?' + searchParams : ''}`
        );
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || 'Failed to fetch categories' },
            { status: error.response?.status || 500 }
        );
    }
}   