import axios from "axios";
import { LoginPayLoad, LoginResponse } from "@/features/accounts/types/account";
import axiosClient from "@/services/axios";

export async function login(payload: LoginPayLoad): Promise<LoginResponse> {
    const response = await axiosClient.post(
        "/auth/login",
        payload
    );
    return response.data
}

export async function logout(): Promise<void> {
    await axiosClient.post("/auth/logout")
}