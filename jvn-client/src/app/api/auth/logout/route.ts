import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST() {
    const cookiesStore = await cookies();
    const refreshToken = cookiesStore.get('refreshToken')?.value;

    if (refreshToken) {
        try {
            await axios.post(`${process.env.API_URL}/accounts/logout/`, {
                refresh: refreshToken
            })
        } catch {

        }
    }
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete("refreshToken");
    return response
}