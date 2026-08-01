import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJobPost } from "../services/jobs";


export function useCreateJobPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createJobPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-jobs'] });
        },
    })
}