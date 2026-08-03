import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/jobs/jobposts/${id}/`);
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Job not found' },
            { status: err.response?.status || 500 }
        );
    }
}