import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { DecisionLedgerItem, DecisionStats, PendingDecision } from './types';

export function useDecisionStats() {
  return useQuery({
    queryKey: ['decisions', 'stats'],
    queryFn: async () => (await apiClient.get<DecisionStats>('/decisions/stats')).data,
  });
}

export interface DecisionLedgerFilters {
  function?: 'all' | 'finance' | 'hr' | 'procurement';
  verdict?: 'all' | 'worked' | 'not_worked';
}

export function useDecisionLedger(filters: DecisionLedgerFilters = {}) {
  return useQuery({
    queryKey: ['decisions', 'ledger', filters],
    queryFn: async () =>
      (await apiClient.get<DecisionLedgerItem[]>('/decisions', { params: filters })).data,
  });
}

export function useApproveDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (decisionId: string) =>
      (await apiClient.post<PendingDecision>(`/decisions/${decisionId}/approve`)).data,
    onSuccess: (_data, decisionId) => {
      queryClient.setQueryData<PendingDecision[]>(['decisions', 'pending'], (prev) =>
        prev ? prev.filter((d) => d.id !== decisionId) : prev
      );
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
