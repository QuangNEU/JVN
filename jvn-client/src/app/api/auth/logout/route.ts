import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST() {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get('accessToken')?.value
    const refreshToken = cookiesStore.get('refreshToken')?.value;

    if (refreshToken && accessToken) {
        try {
            await axios.post(`${process.env.API_URL}/accounts/logout/`, {
                refresh: refreshToken
            },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
        } catch {

        }
    }
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.delete("refreshToken");
    response.cookies.delete("accessToken")
    return response
}