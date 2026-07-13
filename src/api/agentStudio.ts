import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { AgentWorkflow, SimulationResult, StudioEdge, StudioNode } from './types';

// ---------- Raw backend shapes (snake_case) ----------
interface ApiWorkflow {
  id: string;
  name: string;
  status: 'draft' | 'published';
  version: number;
  published_version: number | null;
  nodes: StudioNode[];
  edges: StudioEdge[];
  linked_agent_id?: string | null;
  owner_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string | null;
  organizations: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface ApiSimulationNodeResult {
  nodeId: string;
  summary: string;
}

interface ApiSimulationResult {
  status: string;
  note: string;
  nodeResults: ApiSimulationNodeResult[];
  finalOutputPreview: string | null;
  budgetWarning: string | null;
}

const AVATAR_COLORS = ['#4f7cff', '#00b894', '#e17055', '#6c5ce7', '#00cec9', '#fdcb6e', '#e84393'];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function avatarBgFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function fetchUsersById(): Promise<Map<string, ApiUser>> {
  const res = await apiClient.get<{ users: ApiUser[] }>('/api/users');
  return new Map(res.data.users.map((u) => [u.id, u]));
}

function mapOwner(ownerId: string | null | undefined, usersById: Map<string, ApiUser>): AgentWorkflow['owner'] {
  const user = ownerId ? usersById.get(ownerId) : undefined;
  const name = user?.name ?? 'Unassigned';
  return { name, initials: initialsFor(name), avatarBg: avatarBgFor(name) };
}

function mapWorkflow(raw: ApiWorkflow, usersById: Map<string, ApiUser>): AgentWorkflow {
  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    version: raw.version,
    publishedVersion: raw.published_version,
    nodes: raw.nodes ?? [],
    edges: raw.edges ?? [],
    linkedAgentId: raw.linked_agent_id ?? undefined,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    owner: mapOwner(raw.owner_id, usersById),
    costBudget: undefined,
  };
}

// Map the real /simulate response (structural validation only) into the SimulationResult
// shape the UI expects. The real backend does not run the workflow end-to-end, so its
// status is always 'validated' — we map that to 'partial' rather than 'success' to avoid
// implying a full execution passed, and we surface the honest disclaimer `note` text via
// `finalOutputPreview` so it isn't silently dropped.
function mapSimulationResult(workflowId: string, raw: ApiSimulationResult): SimulationResult {
  return {
    workflowId,
    ranAt: new Date().toISOString(),
    status: 'partial',
    nodeResults: (raw.nodeResults ?? []).map((r) => ({
      nodeId: r.nodeId,
      summary: r.summary,
      sampleOutputPreview: '',
    })),
    finalOutputPreview: raw.finalOutputPreview ?? raw.note ?? '',
    budgetWarning: raw.budgetWarning ?? undefined,
  };
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const [workflowsRes, usersById] = await Promise.all([
        apiClient.get<{ workflows: ApiWorkflow[] }>('/api/workflows'),
        fetchUsersById(),
      ]);
      return workflowsRes.data.workflows.map((w) => mapWorkflow(w, usersById));
    },
  });
}

export function useWorkflow(workflowId: string | undefined) {
  return useQuery({
    queryKey: ['workflows', workflowId],
    queryFn: async () => {
      const [workflowRes, usersById] = await Promise.all([
        apiClient.get<ApiWorkflow>(`/api/workflows/${workflowId}`),
        fetchUsersById(),
      ]);
      return mapWorkflow(workflowRes.data, usersById);
    },
    enabled: !!workflowId,
  });
}

export function useCreateWorkflow() {
  return useMutation({
    mutationFn: async (name?: string) => {
      const [workflowRes, usersById] = await Promise.all([
        apiClient.post<ApiWorkflow>('/api/workflows', { name }),
        fetchUsersById(),
      ]);
      return mapWorkflow(workflowRes.data, usersById);
    },
  });
}

export function useSaveWorkflow(workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { name?: string; nodes?: StudioNode[]; edges?: StudioEdge[] }) => {
      const [workflowRes, usersById] = await Promise.all([
        apiClient.put<ApiWorkflow>(`/api/workflows/${workflowId}`, patch),
        fetchUsersById(),
      ]);
      return mapWorkflow(workflowRes.data, usersById);
    },
    onSuccess: (data) => queryClient.setQueryData(['workflows', workflowId], data),
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workflowId: string) => (await apiClient.delete<{ ok: boolean }>(`/api/workflows/${workflowId}`)).data,
    onSuccess: (_data, workflowId) => {
      queryClient.removeQueries({ queryKey: ['workflows', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useGenerateProcessPrompt(workflowId: string) {
  return useMutation({
    mutationFn: async (vars: { nodeId: string; instructions: string }) =>
      (
        await apiClient.post<{ nodeId: string; generatedPrompt: string }>(
          `/api/workflows/${workflowId}/nodes/${vars.nodeId}/generate-prompt`,
          { instructions: vars.instructions }
        )
      ).data,
  });
}

export function useSimulateWorkflow(workflowId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiSimulationResult>(`/api/workflows/${workflowId}/simulate`);
      return mapSimulationResult(workflowId, res.data);
    },
  });
}

export function usePublishWorkflow(workflowId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const [publishRes, usersById] = await Promise.all([
        apiClient.post<{ workflow: ApiWorkflow; agentId: string }>(`/api/workflows/${workflowId}/publish`),
        fetchUsersById(),
      ]);
      const mapped = mapWorkflow(publishRes.data.workflow, usersById);
      return { ...mapped, agentId: publishRes.data.agentId };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['workflows', workflowId], data);
      queryClient.invalidateQueries({ queryKey: ['agents', 'catalog'] });
    },
  });
}
