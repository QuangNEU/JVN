import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const { companyId } = await params;
    try {
        const res = await axios.get(`${process.env.API_URL}/companies/${companyId}/`);
        return NextResponse.json(res.data);
    } catch (err: any) {
        return NextResponse.json(err.response?.data || { error: "Fetch failed" }, { status: err.response?.status || 500 });
    }
}