import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { DashboardSummary, PendingDecision, PulseItem, LiveRunSummary, TopPerformer } from './types';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await apiClient.get<DashboardSummary>('/dashboard/summary')).data,
  });
}

export function usePendingDecisions() {
  return useQuery({
    queryKey: ['decisions', 'pending'],
    queryFn: async () => (await apiClient.get<PendingDecision[]>('/decisions/pending')).data,
  });
}

export function usePulse() {
  return useQuery({
    queryKey: ['pulse'],
    queryFn: async () => (await apiClient.get<PulseItem[]>('/pulse')).data,
  });
}

export function useLiveRuns() {
  return useQuery({
    queryKey: ['runs', 'live'],
    queryFn: async () => (await apiClient.get<LiveRunSummary[]>('/runs/live')).data,
    refetchInterval: 4000,
  });
}

export function useTopPerformer(period: 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['people', 'top-performer', period],
    queryFn: async () =>
      (await apiClient.get<TopPerformer>('/people/top-performer', { params: { period } })).data,
  });
}
