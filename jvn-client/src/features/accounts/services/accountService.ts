import { GoogleLoginPayLoad, LoginPayLoad, LoginResponse, RegisterPayLoad } from "@/features/accounts/types/account";
import axiosClient from "@/services/axios";

export async function login(payload: LoginPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/login",
        payload
    );
    return response.data
}

export async function googleLogin(payload: GoogleLoginPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/google",
        payload
    )
    return response.data
}

export async function logout(): Promise<void> {
    await axiosClient.post("/auth/logout")
}

export async function register(payload: RegisterPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/register",
        payload
    )
    return response.data
}