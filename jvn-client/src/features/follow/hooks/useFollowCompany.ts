import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followService } from "../services/followService";

export function useFollowCompany(companyId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => followService.toogleFollow(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['check-following', companyId] });
            queryClient.invalidateQueries({ queryKey: ['my-follows'] })
        }
    })
}