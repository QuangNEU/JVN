import { ApplicationStatus } from "@/features/applications/types/application"

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
    SENT: 'Đã gửi',
    RECEIVED: 'Đã nhận',
    WATCHED: 'Đã xem',
    SUITABLE: 'NTD đánh giá phù hợp',
    REJECTED: 'Từ chối',
    INTERVIEWING: 'Phỏng vấn',
    HIRED: 'Đã trúng tuyển',
};

export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
    SENT: 'bg-slate-100 text-slate-600',
    RECEIVED: 'bg-blue-50 text-blue-600',
    WATCHED: 'bg-indigo-50 text-indigo-600',
    SUITABLE: 'bg-teal-50 text-teal-600',
    INTERVIEWING: 'bg-amber-50 text-amber-600',
    HIRED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-600',
};

export const STATUS_FILTER_TABS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'SENT', label: STATUS_LABELS.SENT },
    { value: 'RECEIVED', label: STATUS_LABELS.RECEIVED },
    { value: 'WATCHED', label: STATUS_LABELS.WATCHED },
    { value: 'SUITABLE', label: STATUS_LABELS.SUITABLE },
    { value: 'INTERVIEWING', label: STATUS_LABELS.INTERVIEWING },
    { value: 'HIRED', label: STATUS_LABELS.HIRED },
    { value: 'REJECTED', label: STATUS_LABELS.REJECTED },
];