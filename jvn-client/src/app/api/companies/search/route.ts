import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    try {
        const res = await axios.get(`${process.env.API_URL}/companies/search/`, {
            params: Object.fromEntries(searchParams),
        });
        return NextResponse.json(res.data);
    } catch (err: any) {
        return NextResponse.json(err.response?.data || { error: "Fetch failed" }, { status: err.response?.status || 500 });
    }
}