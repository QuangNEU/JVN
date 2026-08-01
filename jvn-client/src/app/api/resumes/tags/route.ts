import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/resumes/tags/`);
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.message || 'Failed to fetch tags' },
            { status: error.response?.status || 500 }
        );
    }
}