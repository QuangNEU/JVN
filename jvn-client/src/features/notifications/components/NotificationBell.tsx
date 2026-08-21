'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import {
    useUnreadNotificationCount, useMarkAllRead, useNotificationList, useMarkNotificationRead,
} from '../hooks/notificationHooks';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: unreadCount } = useUnreadNotificationCount();
    const { data: listData } = useNotificationList();
    const markAllRead = useMarkAllRead();
    const markRead = useMarkNotificationRead();
    const bellRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])
    const toggleBell = () => {
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen) {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        }
    };

    const handleClickNotification = (n: { id: number; link: string | null; is_read: boolean }) => {
        if (!n.is_read) markRead.mutate(n.id);
        if (n.link) router.push(n.link);
    };

    return (
        <div className="relative" ref={bellRef}>
            <button onClick={toggleBell} className="relative rounded-full p-2 hover:bg-slate-100">
                <Bell className="h-5 w-5 text-slate-600" />
                {!!unreadCount && unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 p-3">
                        <span className="text-sm font-bold text-slate-800">Thông báo</span>
                        <button onClick={() => markAllRead.mutate()} className="text-xs font-medium text-blue-600 hover:underline">
                            Đánh dấu đã đọc hết
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {(listData?.results ?? []).length === 0 ? (
                            <p className="p-6 text-center text-sm text-slate-400">Chưa có thông báo nào.</p>
                        ) : (
                            listData!.results.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleClickNotification(n)}
                                    className={`group flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left text-sm transition-colors last:border-b-0 ${!n.is_read
                                        ? 'bg-blue-50/60 hover:bg-blue-50'
                                        : 'bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    {/* Chấm báo chưa đọc */}
                                    <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
                                        {!n.is_read && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                        )}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={`line-clamp-2 ${!n.is_read
                                                ? 'font-medium text-slate-800'
                                                : 'text-slate-500'
                                                }`}
                                        >
                                            {n.message}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(n.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}