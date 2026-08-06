import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cvService } from "../services/cvService";
import type { CVFormPayload } from "../types/cv";

const CV_QUERY_KEY = ["cvs"] as const;

interface UseCVsOptions {
    enabled?: boolean;
}

export function useCVs(options: UseCVsOptions = {}) {
    return useQuery({
        queryKey: CV_QUERY_KEY,
        queryFn: cvService.list,
        retry: false,
        enabled: options.enabled ?? true,
    });
}

export function useCreateCV() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CVFormPayload) => cvService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
        },
    });
}

export function useUpdateCV() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: CVFormPayload }) =>
            cvService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
        },
    });
}

export function useDeleteCV() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cvService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
        },
    });
}

export function useSetDefaultCV() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cvService.setDefault(id),
        onMutate: async (id: number) => {
            await queryClient.cancelQueries({ queryKey: CV_QUERY_KEY });
            const previous = queryClient.getQueryData(CV_QUERY_KEY);
            queryClient.setQueryData(CV_QUERY_KEY, (old: any) =>
                old?.map((cv: any) => ({ ...cv, is_default: cv.id === id }))
            );
            return { previous };
        },
        onError: (_err, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(CV_QUERY_KEY, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: CV_QUERY_KEY });
        },
    });
}