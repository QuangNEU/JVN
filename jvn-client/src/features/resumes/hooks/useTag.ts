import { useQuery } from '@tanstack/react-query';
import { getTags } from '../services/tagService';

export function useTags() {
    return useQuery({
        queryKey: ['tags'],
        queryFn: getTags,
        staleTime: 10 * 60 * 1000,
    });
}