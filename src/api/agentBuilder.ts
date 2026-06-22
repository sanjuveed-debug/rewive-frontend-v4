import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { AgentBuilderMessage, AgentBuilderSession, AgentPreview } from './types';

export function useAgentBuilderSession(sessionId: string) {
  return useQuery({
    queryKey: ['agent-builder', 'session', sessionId],
    queryFn: async () => (await apiClient.get<AgentBuilderSession>(`/agent-builder/sessions/${sessionId}`)).data,
  });
}

export function useSendAgentBuilderMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) =>
      (await apiClient.post<AgentBuilderMessage>('/agent-builder/messages', { sessionId, text })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-builder', 'session', sessionId] });
    },
  });
}

export function useToggleSelection(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { messageId: string; choiceId: string; selected: boolean }) =>
      (
        await apiClient.patch(`/agent-builder/sessions/${sessionId}/selections`, vars)
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-builder', 'session', sessionId] });
    },
  });
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (sessionId: string) =>
      (await apiClient.post<AgentPreview>('/agents', { sessionId })).data,
  });
}

export function useAgentPreview(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agents', 'preview', agentId],
    queryFn: async () => (await apiClient.get<AgentPreview>(`/agents/${agentId}/preview`)).data,
    enabled: !!agentId,
  });
}

// Draft preview derived from the in-progress session, before the agent is created.
export function useSessionPreview(sessionId: string) {
  return useQuery({
    queryKey: ['agent-builder', 'session', sessionId, 'preview'],
    queryFn: async () => (await apiClient.get<AgentPreview>(`/agent-builder/sessions/${sessionId}/preview`)).data,
  });
}
