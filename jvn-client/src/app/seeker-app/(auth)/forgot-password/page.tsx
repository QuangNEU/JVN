'use client';

import { useState } from 'react';
import axiosClient from '@/services/axios';
import { forgotpassword } from '@/features/accounts/services/accountService';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Gọi API backend của em ở đây
            await forgotpassword({ email })
            setIsSuccess(true);
        } catch (error) {
            alert('Có lỗi xảy ra hoặc email không tồn tại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-md mx-auto mt-20 text-center">
                <h2 className="text-2xl font-bold text-green-600">Đã gửi email!</h2>
                <p className="mt-4">
                    Chúng tôi đã gửi một đường link đặt lại mật khẩu đến <b>{email}</b>.
                    Vui lòng kiểm tra hộp thư (và cả thư mục Spam).
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 shadow-md rounded-md">
            <h2 className="text-2xl font-bold text-center mb-6">Quên Mật Khẩu</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Email của bạn</label>
                    <input
                        type="email"
                        required
                        className="w-full border p-2 rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email đã đăng ký..."
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
                >
                    {isLoading ? 'Đang xử lý...' : 'Gửi link khôi phục'}
                </button>
            </form>
        </div>
    );
}