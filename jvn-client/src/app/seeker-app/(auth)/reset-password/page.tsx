'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axiosClient from '@/services/axios';
import { resetPassword } from '@/features/accounts/services/accountService';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Lấy uid và token từ thanh URL
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (!uid || !token) {
            alert('Missing uid or token, you dont have permission to change password')
            return
        }
        setIsLoading(true);
        try {
            // Gửi dữ liệu lên API Reset Password của Django
            await resetPassword({ new_password: newPassword, confirm_new_password: confirmPassword, uid: uid, token: token })

            alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            router.push('/login');

        } catch (error) {
            alert('Link đã hết hạn hoặc không hợp lệ.');
        } finally {
            setIsLoading(false);
        }
    };

    // Nếu người dùng truy cập trang này mà không có uid hoặc token trên URL
    if (!uid || !token) {
        return <div className="text-center mt-20 text-red-500">Đường dẫn không hợp lệ!</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 shadow-md rounded-md">
            <h2 className="text-2xl font-bold text-center mb-6">Tạo Mật Khẩu Mới</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                    <input
                        type="password"
                        required
                        className="w-full border p-2 rounded"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                    <input
                        type="password"
                        required
                        className="w-full border p-2 rounded"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-600 text-white p-2 rounded disabled:bg-gray-400"
                >
                    {isLoading ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
                </button>
            </form>
        </div>
    );
}