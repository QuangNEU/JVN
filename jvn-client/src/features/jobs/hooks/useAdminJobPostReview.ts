import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { approveJobPost, getAdminJobPostReview, rejectJobPost } from "@/features/jobs/services/jobs";
import { JobPostReviewParams } from "@/features/jobs/types/jobs";

export function useAdminJobPostReview(params: JobPostReviewParams) {
    const { user } = useAuthStore(); // hoặc nguồn user hiện tại của em
    return useQuery({
        queryKey: ['admin-job-post-review', user?.id, params],
        queryFn: () => getAdminJobPostReview(params),
        enabled: !!user,
        staleTime: 30 * 1000,
    });
}

export function useApproveJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveJobPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-job-post-review'] }); // prefix ngắn, khớp mọi status tab
        },
    });
}

export function useRejectJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: rejectJobPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-job-post-review'] });
        },
    });
}