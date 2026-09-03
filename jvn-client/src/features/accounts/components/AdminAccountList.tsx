'use client';

import { useState } from 'react';
import { useAdminAccountList, useAccountLockHistory, useLockAccount, useUnlockAccount } from '../hooks/useAccountLock';
import { AdminAccountItem, Role } from '../types/account';

const ROLE_TABS: { label: string; value: Role | undefined }[] = [
    { label: 'Tất cả', value: undefined },
    { label: 'Ứng viên', value: Role.SEEKER },
    { label: 'Nhà tuyển dụng', value: Role.COMPANY },
];

export default function AdminAccountList() {
    const [roleFilter, setRoleFilter] = useState<Role | undefined>(undefined);
    const [lockedOnly, setLockedOnly] = useState<boolean | undefined>(undefined);
    const [lockTarget, setLockTarget] = useState<AdminAccountItem | null>(null);
    const [historyTarget, setHistoryTarget] = useState<AdminAccountItem | null>(null);
    const [reason, setReason] = useState('');

    const { data, isLoading } = useAdminAccountList({ role: roleFilter, is_locked: lockedOnly, page_size: 20 });
    const { data: history, isLoading: historyLoading } = useAccountLockHistory(historyTarget?.id ?? null);
    const lockMutation = useLockAccount();
    const unlockMutation = useUnlockAccount();

    const handleLockSubmit = () => {
        if (!lockTarget || !reason.trim()) return;
        lockMutation.mutate(
            { account: lockTarget, reason },
            { onSuccess: () => { setLockTarget(null); setReason(''); } }
        );
    };

    const handleUnlock = (account: AdminAccountItem) => {
        unlockMutation.mutate(account);
    };

    return (
        <div className="p-6 max-w-5xl">
            <h1 className="text-xl font-semibold text-slate-900">Quản lý tài khoản</h1>
            <p className="text-sm text-slate-500 mt-1">Khóa hoặc mở khóa tài khoản vi phạm.</p>

            <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
                <div className="flex gap-2">
                    {ROLE_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setRoleFilter(tab.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${roleFilter === tab.value
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={lockedOnly === true}
                        onChange={(e) => setLockedOnly(e.target.checked ? true : undefined)}
                    />
                    Chỉ hiện tài khoản đã khóa
                </label>
            </div>

            {isLoading && <div className="py-16 text-center text-sm text-slate-400">Đang tải...</div>}

            {!isLoading && data?.results.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">Không có tài khoản nào.</div>
            )}

            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs font-medium text-slate-400 border-b border-slate-100">
                            <th className="py-3 pr-4">Email</th>
                            <th className="py-3 pr-4">Tên</th>
                            <th className="py-3 pr-4">Vai trò</th>
                            <th className="py-3 pr-4">Trạng thái</th>
                            <th className="py-3 pr-4">Ngày tham gia</th>
                            <th className="py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.results.map((account) => (
                            <tr key={account.id} className="border-b border-slate-50">
                                <td className="py-3 pr-4 text-slate-900">{account.email}</td>
                                <td className="py-3 pr-4 text-slate-600">{account.name}</td>
                                <td className="py-3 pr-4 text-slate-600">
                                    {account.role === Role.COMPANY ? 'Nhà tuyển dụng' : 'Ứng viên'}
                                </td>
                                <td className="py-3 pr-4">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${account.is_locked
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                        {account.is_locked ? 'Đã khóa' : 'Hoạt động'}
                                    </span>
                                </td>
                                <td className="py-3 pr-4 text-slate-500">
                                    {new Date(account.date_joined).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setHistoryTarget(account)}
                                            className="text-slate-500 hover:text-slate-700 underline underline-offset-2"
                                        >
                                            Lịch sử
                                        </button>
                                        {account.is_locked ? (
                                            <button
                                                onClick={() => handleUnlock(account)}
                                                disabled={unlockMutation.isPending}
                                                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                                            >
                                                Mở khóa
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setLockTarget(account)}
                                                className="text-red-600 hover:text-red-700 font-medium"
                                            >
                                                Khóa
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {lockTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="font-medium text-slate-900">Khóa tài khoản</h3>
                        <p className="text-sm text-slate-500 mt-1">{lockTarget.email}</p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do khóa tài khoản..."
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm mt-4 min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setLockTarget(null); setReason(''); }}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleLockSubmit}
                                disabled={!reason.trim() || lockMutation.isPending}
                                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white disabled:opacity-50"
                            >
                                Xác nhận khóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {historyTarget && (
                <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium text-slate-900">Lịch sử khóa tài khoản</h3>
                                <p className="text-sm text-slate-500 mt-1">{historyTarget.email}</p>
                            </div>
                            <button onClick={() => setHistoryTarget(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {historyLoading && <p className="text-sm text-slate-400">Đang tải...</p>}
                            {!historyLoading && history?.length === 0 && (
                                <p className="text-sm text-slate-400">Chưa có lịch sử nào.</p>
                            )}
                            {history?.map((h) => (
                                <div key={h.id} className="border border-slate-100 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.action === 'LOCKED' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            {h.action === 'LOCKED' ? 'Khóa' : 'Mở khóa'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(h.created_at).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                    {h.reason && <p className="text-sm text-slate-600 mt-2">{h.reason}</p>}
                                    <p className="text-xs text-slate-400 mt-1">Thực hiện bởi: {h.performed_by_email ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}