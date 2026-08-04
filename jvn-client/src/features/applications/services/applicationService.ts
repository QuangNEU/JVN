import { Application, ApplyJobPayload, GetMyApplicationsParams, PaginatedResponse } from '../types/application';

async function parseErrorMessage(res: Response): Promise<string> {
    const body = await res.json().catch(() => null);
    if (!body) return 'Có lỗi xảy ra, vui lòng thử lại.';
    if (typeof body.error === 'string') return body.error;
    if (typeof body.detail === 'string') return body.detail;
    if (Array.isArray(body.non_field_errors)) return body.non_field_errors[0];
    const firstKey = Object.keys(body)[0];
    if (firstKey && Array.isArray(body[firstKey])) return body[firstKey][0];
    return 'Có lỗi xảy ra, vui lòng thử lại.';
}

export const applicationService = {
    applyJob: async (jobPostId: number, payload: ApplyJobPayload): Promise<Application> => {
        const res = await fetch(`/api/applications/apply/${jobPostId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res));
        return res.json();
    },

    getMyApplications: async (
        params: GetMyApplicationsParams = {}
    ): Promise<PaginatedResponse<Application>> => {
        const search = new URLSearchParams();
        if (params.status) search.set('status', params.status);
        if (params.page) search.set('page', String(params.page));
        const query = search.toString() ? `?${search.toString()}` : '';

        const res = await fetch(`/api/applications/me${query}`, { method: 'GET' });
        if (!res.ok) throw new Error(await parseErrorMessage(res));
        return res.json();
    },
};