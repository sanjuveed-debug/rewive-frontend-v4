import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface WorkbenchAgentOutput {
  agent_id: string;
  agent_name: string;
  focus_area: string;
  output: string;
  tokens_used: number;
}

export interface WorkbenchResult {
  report_id: string;
  title: string;
  year: number;
  quarter: string | null;
  agent_outputs: WorkbenchAgentOutput[];
}

export interface WorkbenchStatus {
  status: 'running' | 'complete' | 'error';
  result: WorkbenchResult | null;
  error: string | null;
}

export function useSubmitWorkbench() {
  return useMutation({
    mutationFn: async (vars: { name: string; objective: string; agentIds: string[]; year: number; quarter?: string }) =>
      (
        await apiClient.post<{ task_id: string }>('/api/workbench/submit', {
          name: vars.name,
          objective: vars.objective,
          agent_ids: vars.agentIds,
          year: vars.year,
          quarter: vars.quarter,
        })
      ).data,
  });
}

// Polls a real workbench run until it completes — used right after useSubmitWorkbench
// so the UI can show live progress rather than a fire-and-forget submission.
export function useWorkbenchStatus(taskId: string | undefined) {
  return useQuery({
    queryKey: ['workbench', 'status', taskId],
    queryFn: async () => (await apiClient.get<WorkbenchStatus>(`/api/workbench/status/${taskId}`)).data,
    enabled: !!taskId,
    refetchInterval: (query) => (query.state.data?.status === 'running' ? 3000 : false),
  });
}
