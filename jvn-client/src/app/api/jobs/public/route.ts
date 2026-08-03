import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/jobs/jobposts/public/${request.nextUrl.search}`
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to fetch jobs' },
            { status: err.response?.status || 500 }
        );
    }
}