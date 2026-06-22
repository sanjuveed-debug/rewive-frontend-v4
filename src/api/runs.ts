import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { RunDetail, RunListItem, RunStatus } from './types';

export function useRuns(status: RunStatus | 'all' = 'all') {
  return useQuery({
    queryKey: ['runs', 'list', status],
    queryFn: async () => (await apiClient.get<RunListItem[]>('/runs', { params: { status } })).data,
  });
}

export function useRunDetail(runId: string | undefined) {
  return useQuery({
    queryKey: ['runs', 'detail', runId],
    queryFn: async () => (await apiClient.get<RunDetail>(`/runs/${runId}`)).data,
    enabled: !!runId,
    refetchInterval: (query) => (query.state.data?.isLive ? 3000 : false),
  });
}

export function usePauseRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => (await apiClient.post(`/runs/${runId}/pause`)).data,
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({ queryKey: ['runs', 'detail', runId] });
      queryClient.invalidateQueries({ queryKey: ['runs', 'list'] });
    },
  });
}

export function useResumeRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => (await apiClient.post(`/runs/${runId}/resume`)).data,
    onSuccess: (_data, runId) => {
      queryClient.invalidateQueries({ queryKey: ['runs', 'detail', runId] });
      queryClient.invalidateQueries({ queryKey: ['runs', 'list'] });
    },
  });
}
