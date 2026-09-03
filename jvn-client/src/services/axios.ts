import axios from "axios"
import { SEEKER_PROTECTED_ROUTES, EMPLOYER_PROTECTED_ROUTES } from "@/constants/protectedRoute";


const axiosClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000,
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve();
    });
    failedQueue = [];
};


axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const excludedUrls = ['/auth/login', '/auth/refresh', '/auth/register'];
        const isExcluded = excludedUrls.some((url) => originalRequest.url?.includes(url));

        const errorCode = error.response?.data?.code;
        if (errorCode === 'account_locked') {
            try {
                await axiosClient.post('/auth/logout');
            } catch { }
            window.location.href = '/login?reason=locked';
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry && !isExcluded) {
            if (isRefreshing) {
                // đang refresh rồi, xếp hàng đợi thay vì gọi refresh nhiều lần cùng lúc
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => axiosClient(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axiosClient.post('/auth/refresh');
                processQueue(null);
                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);

                const currentPath = window.location.pathname;
                const isEmployerDomain = window.location.hostname.startsWith('tuyendung.');
                const protectedRoutes = isEmployerDomain ? EMPLOYER_PROTECTED_ROUTES : SEEKER_PROTECTED_ROUTES;
                const isProtected = protectedRoutes.some((r) => currentPath.startsWith(r));

                if (isProtected) {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response?.status === 429) {
            const waitSeconds = error.response.headers['retry-after'];
            (error as any).retryAfter = waitSeconds;
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosClient