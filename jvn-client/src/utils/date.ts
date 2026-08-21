/**
 * Tính số ngày còn lại từ hôm nay đến một ngày đích
 * @param dateStr Chuỗi ngày tháng (VD: "2026-08-22")
 * @returns Số ngày còn lại (Không trả về số âm)
 */
export function daysLeft(dateStr: string | null): number {
    if (!dateStr) return 0;

    const expirationDate = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
}