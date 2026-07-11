import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

// There is no session/wizard API on the real backend — the stateful multi-step
// agent builder chat has no server-side equivalent. This module is a plain form:
// list available tools, optionally pre-fill a focus-area description via the
// general chat endpoint, and create the agent directly.

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  is_default: boolean;
  param_count: number;
}

export interface CreateAgentPayload {
  name: string;
  focus_area: string;
  category: string;
  max_turns: number;
  model: string;
  tool_names: string[];
  is_active: boolean;
}

export interface CreatedAgent {
  id: string;
  name: string;
  focus_area: string;
  category: string;
  max_turns: number;
  model: string;
  tool_names: string[];
  is_active: boolean;
  [key: string]: unknown;
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => (await apiClient.get<{ tools: Tool[] }>('/api/tools')).data.tools ?? [],
  });
}

export function useCreateAgent() {
  return useMutation({
    mutationFn: async (payload: CreateAgentPayload) =>
      (await apiClient.post<CreatedAgent>('/api/agents', payload)).data,
  });
}

// Best-effort assist: ask the general chat endpoint to turn a plain-English prompt
// into a focus-area description. Never throws — returns null on any failure or
// unexpected response shape so the UI can silently fall back to manual entry.
export async function describeAgentFocus(prompt: string): Promise<string | null> {
  try {
    const trimmed = prompt.trim();
    if (!trimmed) return null;
    const res = await apiClient.post<{ response?: string }>('/api/chat', {
      message: `Write a concise (2-3 sentence) focus-area description for an FP&A agent based on this request: ${trimmed}`,
    });
    const text = res.data?.response;
    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}
