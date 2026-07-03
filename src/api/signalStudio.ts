import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { SuggestedSignal, DatasetSignalCoverage, SignalDetail } from './types';

export function useSignalDetail(signalId: string | undefined) {
  return useQuery({
    queryKey: ['signals', signalId, 'detail'],
    queryFn: async () => (await apiClient.get<SignalDetail>(`/signals/${signalId}/detail`)).data,
    enabled: !!signalId,
  });
}

export function useSuggestedSignals(connectionId?: string) {
  return useQuery({
    queryKey: ['signals', 'suggested', connectionId],
    queryFn: async () => (await apiClient.get<SuggestedSignal[]>('/signals/suggested', { params: { connectionId } })).data,
  });
}

export function useDatasetSignalCoverage(connectionId: string | undefined) {
  return useQuery({
    queryKey: ['connections', connectionId, 'signal-coverage'],
    queryFn: async () => (await apiClient.get<DatasetSignalCoverage>(`/connections/${connectionId}/signal-coverage`)).data,
    enabled: !!connectionId,
  });
}
