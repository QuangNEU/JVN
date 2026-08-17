import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, updateMyProfile } from "../services/companyProfileService";

export function useMyProfile() {
    return useQuery({
        queryKey: ['my-profile'],
        queryFn: getMyProfile,
        refetchOnWindowFocus: false,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateMyProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
        }
    })
}