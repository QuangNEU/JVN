import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    const body = await req.json()
    try {
        await axios.post(`${process.env.API_URL}/accounts/password/reset/`,
            body
        )
    } catch (err: any) {
        const status = err.response?.status || 500
        const error = err.response?.data?.error || "Cannot update"
        return NextResponse.json({ error: error }, { status })
    }
    const response = NextResponse.json({ message: "Update successful" })
    return response
}