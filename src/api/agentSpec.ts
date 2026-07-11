import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  AgentDelegateIdentity,
  AgentSpec,
  AgentSpecCapability,
  AgentSpecStatus,
  AgentSpecVersionEntry,
  HandoffCardData,
} from './types';

// ---------- Real backend response shapes ----------
// The real /api/agent-specs endpoints return snake_case fields and store
// dataContract/permissions/guardrails as free-form jsonb objects (verified via
// curl against the live backend), not the string[]/string shapes the frontend
// type uses -- so we wrap/unwrap them on the way in/out (see toWireDeveloperBody /
// fromApiSpec below).
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string | null;
}

interface ApiTestRunResult {
  ranAt: string;
  output: string;
}

interface ApiAgentSpec {
  id: string;
  name: string;
  persona: string | null;
  solution_design_id: string | null;
  task_id: string | null;
  status: AgentSpecStatus;
  owner_id: string | null;
  version: number;
  version_trail: AgentSpecVersionEntry[];
  intent: string | null;
  capabilities: AgentSpecCapability[];
  plan_preview: string[];
  delegate_identity: Partial<AgentDelegateIdentity>;
  data_contract: { items?: string[] } | Record<string, unknown>;
  permissions: { items?: string[] } | Record<string, unknown>;
  guardrails: { text?: string } | Record<string, unknown>;
  test_run_result: ApiTestRunResult | null;
  linked_agent_id: string | null;
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

async function lookupOwner(ownerId: string | null): Promise<{ name: string; initials: string; avatarBg: string }> {
  if (!ownerId) return { name: 'Unassigned', initials: 'U', avatarBg: AVATAR_COLORS[0] };
  try {
    const res = await apiClient.get<{ users: ApiUser[] }>('/api/users');
    const user = res.data.users.find((u) => u.id === ownerId);
    if (!user) return { name: 'Unassigned', initials: 'U', avatarBg: AVATAR_COLORS[0] };
    return { name: user.name, initials: initialsFor(user.name), avatarBg: avatarBgFor(user.name) };
  } catch {
    return { name: 'Unassigned', initials: 'U', avatarBg: AVATAR_COLORS[0] };
  }
}

// Best-effort escalation/handback cards derived from the version trail — the real
// backend only tracks a status transition + a version_trail entry, not the
// structured HandoffCardData the mock type models. We synthesize a minimal card
// from the most recent matching trail entry so the UI's HandoffCard still renders;
// there is no `contract` sub-object available so that part is always omitted.
function deriveHandoffCard(
  trail: AgentSpecVersionEntry[],
  kind: 'escalate' | 'handback',
  ownerName: string
): HandoffCardData | null {
  const matchText = kind === 'escalate' ? 'escalated' : 'handed back';
  const entry = [...trail].reverse().find((v) => v.summary.toLowerCase().includes(matchText));
  if (!entry) return null;
  return {
    kind,
    fromName: entry.actorName,
    fromRole: entry.actorName === ownerName ? 'Owner' : 'Team',
    toLabel: kind === 'escalate' ? 'Developer' : 'Business',
    note: entry.summary,
    createdAt: entry.timestamp,
  };
}

async function fromApiSpec(raw: ApiAgentSpec): Promise<AgentSpec> {
  const owner = await lookupOwner(raw.owner_id);
  const dataContractItems = Array.isArray((raw.data_contract as { items?: string[] })?.items)
    ? (raw.data_contract as { items?: string[] }).items!
    : [];
  const permissionsItems = Array.isArray((raw.permissions as { items?: string[] })?.items)
    ? (raw.permissions as { items?: string[] }).items!
    : [];
  const guardrailsText = typeof (raw.guardrails as { text?: string })?.text === 'string'
    ? (raw.guardrails as { text?: string }).text!
    : '';

  return {
    id: raw.id,
    name: raw.name,
    // The real backend does not track persona on agent specs (always null) --
    // defaulting to 'cfo' as a harmless placeholder since no screen we own reads it.
    persona: (raw.persona as AgentSpec['persona']) ?? 'cfo',
    solutionDesignId: raw.solution_design_id ?? '',
    taskId: raw.task_id ?? '',
    status: raw.status,
    // Real backend doesn't return this field -- default to false honestly.
    needsTechnicalWork: false,
    owner,
    version: raw.version,
    versionTrail: raw.version_trail,
    intent: raw.intent ?? '',
    capabilities: raw.capabilities ?? [],
    planPreview: raw.plan_preview ?? [],
    delegateIdentity: {
      delegateName: raw.delegate_identity.delegateName ?? '',
      tone: raw.delegate_identity.tone ?? 'direct',
      communicationStyle: raw.delegate_identity.communicationStyle ?? 'concise',
      responseType: raw.delegate_identity.responseType ?? 'wait_to_be_asked',
      escalationTemperament: raw.delegate_identity.escalationTemperament ?? 50,
      workingHours: raw.delegate_identity.workingHours ?? 'business_hours',
      whenUnsure: raw.delegate_identity.whenUnsure ?? '',
    },
    dataContract: dataContractItems,
    permissions: permissionsItems,
    guardrails: guardrailsText,
    testRunResult: raw.test_run_result ? raw.test_run_result.output : null,
    escalation: deriveHandoffCard(raw.version_trail, 'escalate', owner.name),
    handback: deriveHandoffCard(raw.version_trail, 'handback', owner.name),
    linkedAgentId: raw.linked_agent_id ?? undefined,
  };
}

export function useAgentSpec(id: string | undefined) {
  return useQuery({
    queryKey: ['agent-specs', id],
    queryFn: async () => fromApiSpec((await apiClient.get<ApiAgentSpec>(`/api/agent-specs/${id}`)).data),
    enabled: !!id,
  });
}

export function useCreateAgentSpec() {
  return useMutation({
    mutationFn: async (vars: { solutionId: string; taskId: string; name?: string }) =>
      fromApiSpec((await apiClient.post<ApiAgentSpec>('/api/agent-specs', vars)).data),
  });
}

function useAgentSpecMutation(id: string, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: Record<string, unknown>) =>
      fromApiSpec((await apiClient.post<ApiAgentSpec>(`/api/agent-specs/${id}${path}`, body)).data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['agent-specs', id], updated);
      queryClient.invalidateQueries({ queryKey: ['agents', 'catalog'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateBusinessAltitude(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { intent?: string; capabilities?: AgentSpecCapability[] }) =>
      fromApiSpec((await apiClient.patch<ApiAgentSpec>(`/api/agent-specs/${id}/business`, vars)).data),
    onSuccess: (updated) => queryClient.setQueryData(['agent-specs', id], updated),
  });
}

export function useUpdateDelegateIdentity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: Partial<AgentDelegateIdentity>) =>
      fromApiSpec((await apiClient.patch<ApiAgentSpec>(`/api/agent-specs/${id}/delegate`, vars)).data),
    onSuccess: (updated) => queryClient.setQueryData(['agent-specs', id], updated),
  });
}

export function useUpdateDeveloperAltitude(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { dataContract?: string[]; permissions?: string[]; guardrails?: string }) => {
      // The real /developer endpoint requires dataContract/permissions/guardrails to
      // each be a JSON object (verified via curl -- sending arrays/strings 422s with
      // "Input should be a valid dictionary"), so we wrap them here and unwrap again
      // in fromApiSpec.
      const wireBody: Record<string, unknown> = {};
      if (vars.dataContract) wireBody.dataContract = { items: vars.dataContract };
      if (vars.permissions) wireBody.permissions = { items: vars.permissions };
      if (vars.guardrails !== undefined) wireBody.guardrails = { text: vars.guardrails };
      return fromApiSpec((await apiClient.patch<ApiAgentSpec>(`/api/agent-specs/${id}/developer`, wireBody)).data);
    },
    onSuccess: (updated) => queryClient.setQueryData(['agent-specs', id], updated),
  });
}

export function useEscalateAgentSpec(id: string) {
  return useAgentSpecMutation(id, '/escalate');
}

export function useTestRunAgentSpec(id: string) {
  return useAgentSpecMutation(id, '/test-run');
}

export function useHandbackAgentSpec(id: string) {
  return useAgentSpecMutation(id, '/handback');
}

export function usePublishAgentSpec(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // /publish's response is shaped differently from every other agent-spec
      // endpoint -- {spec, agentId} instead of the spec directly (verified via curl).
      const res = (await apiClient.post<{ spec: ApiAgentSpec; agentId: string }>(`/api/agent-specs/${id}/publish`)).data;
      return fromApiSpec(res.spec);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['agent-specs', id], updated);
      queryClient.invalidateQueries({ queryKey: ['agents', 'catalog'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
