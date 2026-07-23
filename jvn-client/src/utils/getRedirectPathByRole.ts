import { Role } from "@/features/accounts/types/account";

export function getRedirectByRole(role: Role) {
    if (role == Role.COMPANY) return '/company/jobs';
    return '/jobs'
}