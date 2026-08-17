import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
    try {
        const res = await axios.get(`${process.env.API_URL}/companies/featured/`);
        return NextResponse.json(res.data);
    } catch (err: any) {
        return NextResponse.json(err.response?.data || { error: "Fetch failed" }, { status: err.response?.status || 500 });
    }
}