import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  BrainEdge,
  BrainNode,
  ClosureKpi,
  CustomBrainNodeInput,
  DispositionInput,
  Finding,
  FindingStatus,
  ImpactPathStep,
  IndustryKey,
  IndustryOption,
  KpiBrain,
  OrgProfile,
  Persona,
  ShadowAgent,
  ShadowOrg,
  StreamDef,
  UpdateBrainNodeInput,
} from './types';

// ---------- Shared helpers (same convention as dashboard.ts / people.ts) ----------
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

// A human-readable label from a stream key, e.g. "modern_trade" -> "Modern Trade".
function labelFromKey(key: string) {
  return key
    .split(/[_-]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------- Mapping: org profile & industries ----------
function mapOrgProfile(raw: any): OrgProfile {
  return { orgName: raw.org_name, industry: raw.industry };
}

// /api/industries is already camelCase on the wire — pass through.
function mapIndustry(raw: any): IndustryOption {
  return raw;
}

export function useOrgProfile() {
  return useQuery({
    queryKey: ['org-profile'],
    queryFn: async () => mapOrgProfile((await apiClient.get('/api/org-profile')).data),
  });
}

export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    queryFn: async () => ((await apiClient.get('/api/industries')).data as any[]).map(mapIndustry),
  });
}

export function useSetIndustry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (industry: IndustryKey) =>
      mapOrgProfile((await apiClient.put('/api/org-profile', { industry })).data),
    onSuccess: (profile) => {
      queryClient.setQueryData(['org-profile'], profile);
      // Everything downstream of the brain is industry-scoped.
      queryClient.invalidateQueries({ queryKey: ['kpi-brain'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-org'] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['closure-kpis'] });
    },
  });
}

// ---------- Mapping: KPI brain ----------
function mapBrainNode(raw: any): BrainNode {
  return {
    id: raw.id,
    kind: raw.kind,
    name: raw.name,
    streamKey: raw.stream_key,
    definition: raw.definition,
    currentValue: raw.current_value,
    targetValue: raw.target_value,
    trend: raw.trend,
    health: raw.health,
    status: raw.status,
    proposedBy: raw.proposed_by,
    dataSources: raw.data_sources ?? [],
  };
}

function mapBrainEdge(raw: any): BrainEdge {
  return {
    id: raw.id,
    source: raw.source_id,
    target: raw.target_id,
    weight: raw.weight,
    status: raw.status,
    rationale: raw.rationale,
    proposedBy: raw.proposed_by,
  };
}

// The real backend has no stream-definition table — synthesize a StreamDef per
// distinct stream_key actually present on the graph's nodes. "answersTo" has no
// real backend equivalent, so it's left blank.
function synthesizeStreams(nodes: BrainNode[]): StreamDef[] {
  const seen = new Map<string, StreamDef>();
  for (const n of nodes) {
    if (n.streamKey && !seen.has(n.streamKey)) {
      seen.set(n.streamKey, { key: n.streamKey, name: labelFromKey(n.streamKey), answersTo: '' });
    }
  }
  return Array.from(seen.values());
}

function mapKpiBrain(raw: any, industry: IndustryKey): KpiBrain {
  const nodes = (raw.nodes ?? []).map(mapBrainNode);
  const edges = (raw.edges ?? []).map(mapBrainEdge);
  return { industry, streams: synthesizeStreams(nodes), nodes, edges };
}

export function useKpiBrain() {
  const { data: profile } = useOrgProfile();
  const industry = profile?.industry;
  return useQuery({
    queryKey: ['kpi-brain', industry],
    queryFn: async () =>
      mapKpiBrain((await apiClient.get('/api/kpi-brain', { params: { industry } })).data, industry as IndustryKey),
    enabled: !!industry,
  });
}

// The real backend has no endpoint to link a custom node to a target/stream KPI
// (CustomBrainNodeInput.contributesTo has no wire equivalent) — the node is created
// unlinked; contributesTo is intentionally not sent.
export function useAddBrainNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomBrainNodeInput) =>
      (
        await apiClient.post('/api/kpi-brain/nodes', {
          name: input.name,
          kind: 'stream_kpi',
          stream_key: input.streamKey,
          definition: input.definition,
          data_sources: input.dataSources,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpi-brain'] }),
  });
}

export function useUpdateBrainNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateBrainNodeInput) =>
      (
        await apiClient.patch(`/api/kpi-brain/nodes/${id}`, {
          name: patch.name,
          definition: patch.definition,
          target_value: patch.targetValue,
          stream_key: patch.streamKey,
          data_sources: patch.dataSources,
        })
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kpi-brain'] }),
  });
}

// NOTE: the real backend only exposes accept/decline for *nodes*
// (POST /api/kpi-brain/nodes/{id}/accept|decline) — there is no edge-level
// accept/decline endpoint. For kind:'edge' this is a client-only optimistic
// update of the cached KpiBrain (marks the edge connected/declined) rather than
// a network call, since calling a nonexistent endpoint would just 404.
export function useResolveBrainProposal() {
  const queryClient = useQueryClient();
  const { data: profile } = useOrgProfile();
  return useMutation({
    mutationFn: async (input: { kind: 'node' | 'edge'; id: string; action: 'accept' | 'decline' }) => {
      if (input.kind === 'edge') {
        return { clientOnly: true as const, ...input };
      }
      return (await apiClient.post(`/api/kpi-brain/nodes/${input.id}/${input.action}`)).data;
    },
    onSuccess: (_result, variables) => {
      const industry = profile?.industry;
      if (variables.kind === 'edge') {
        // BrainEdge.status only models 'connected' | 'proposed' (no 'declined' variant,
        // mirroring how declined nodes are simply filtered out of the canvas) — so a
        // decline just drops the edge from the cached graph instead of relabeling it.
        queryClient.setQueryData<KpiBrain | undefined>(['kpi-brain', industry], (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            edges:
              variables.action === 'accept'
                ? prev.edges.map((e) => (e.id === variables.id ? { ...e, status: 'connected' as const } : e))
                : prev.edges.filter((e) => e.id !== variables.id),
          };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['kpi-brain'] });
      }
    },
  });
}

// ---------- Mapping: shadow org ----------
// The real shadow_agents row has no human-owner name/role columns (only
// human_owner_id) and no watches_node_ids column — those are honestly
// synthesized/empty below.
function mapShadowAgent(raw: any): ShadowAgent {
  const ownerLabel = raw.human_owner_id ? String(raw.human_owner_id) : 'Unassigned';
  return {
    id: raw.agent_id,
    name: raw.agent_name,
    streamKey: raw.stream_key,
    humanOwner: {
      name: ownerLabel,
      initials: initialsFor(ownerLabel),
      avatarBg: avatarBgFor(ownerLabel),
      role: '—',
    },
    watchesNodeIds: [],
    openFindings: raw.open_findings ?? 0,
    slaBreaches: raw.sla_breaches ?? 0,
    temperament: raw.temperament ?? 50,
    health: raw.health,
    lastFindingAt: null,
    reportsToAgentId: raw.reports_to_agent_id,
  };
}

function mapShadowOrg(raw: any, industry: IndustryKey): ShadowOrg {
  return { industry, agents: (raw.shadow_agents ?? []).map(mapShadowAgent) };
}

export function useShadowOrg() {
  const { data: profile } = useOrgProfile();
  const industry = profile?.industry;
  return useQuery({
    queryKey: ['shadow-org', industry],
    queryFn: async () =>
      mapShadowOrg((await apiClient.get('/api/shadow-org', { params: { industry } })).data, industry as IndustryKey),
    enabled: !!industry,
    refetchInterval: 30_000,
  });
}

// ---------- Mapping: findings ----------
function mapImpactStep(raw: any): ImpactPathStep {
  return { nodeId: raw.node_id, nodeName: raw.node_name, kind: raw.kind, effect: raw.effect };
}

function mapFinding(raw: any): Finding {
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    raisedByAgentId: raw.raised_by_agent_id,
    raisedByAgentName: raw.raised_by_agent_name,
    streamKey: raw.stream_key,
    linkedKpiNodeId: raw.linked_kpi_node_id,
    severity: raw.severity,
    impactPath: (raw.impact_path ?? []).map(mapImpactStep),
    impactEstimate: raw.impact_estimate,
    evidence: raw.evidence ?? [],
    status: raw.status,
    disposition: raw.disposition,
    dispositionBy: raw.disposition_by,
    dispositionAt: raw.disposition_at,
    dispositionReason: raw.disposition_reason,
    slaHoursRemaining: raw.sla_hours_remaining,
    escalationLevel: raw.escalation_level ?? 0,
    escalatedToAgentId: raw.escalated_to_agent_id,
    closureKpiId: raw.closure_kpi_id,
    solutionDesignId: raw.solution_design_id,
    reAlertCondition: raw.re_alert_condition,
    assessorVerdict: raw.assessor_verdict ?? null,
    detectedAt: raw.detected_at,
    // No real backend equivalent — hardcoded, same simplification used elsewhere this session.
    persona: 'cfo' as Persona,
  };
}

export interface FindingFilters {
  persona?: Persona | 'all';
  stream?: string | 'all';
  status?: FindingStatus | 'all';
}

// `filters.persona` has no real backend dimension (findings aren't persona-scoped
// server-side) — it is intentionally dropped rather than sent or filtered on.
export function useFindings(filters: FindingFilters = {}) {
  const { stream, status } = filters;
  return useQuery({
    queryKey: ['findings', stream, status],
    queryFn: async (): Promise<Finding[]> => {
      const res = await apiClient.get('/api/findings', {
        params: {
          stream: stream && stream !== 'all' ? stream : undefined,
          status: status && status !== 'all' ? status : undefined,
        },
      });
      const raw: any[] = res.data.findings ?? [];
      return raw.map(mapFinding);
    },
    refetchInterval: 30_000,
  });
}

export function useFinding(findingId: string | undefined) {
  return useQuery({
    queryKey: ['findings', findingId],
    queryFn: async () => mapFinding((await apiClient.get(`/api/findings/${findingId}`)).data),
    enabled: !!findingId,
  });
}

export function useDisposeFinding(findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DispositionInput) =>
      mapFinding(
        (
          await apiClient.post(`/api/findings/${findingId}/disposition`, {
            disposition: input.disposition,
            reason: input.reason,
            re_alert_condition: input.reAlertCondition,
          })
        ).data,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(['findings', findingId], updated);
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-org'] });
      // Accept creates a closure KPI; act creates a solution design.
      queryClient.invalidateQueries({ queryKey: ['closure-kpis'] });
    },
  });
}

export function useEscalateFinding(findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => mapFinding((await apiClient.post(`/api/findings/${findingId}/escalate`)).data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['findings', findingId], updated);
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-org'] });
    },
  });
}

export function useReAlertFinding(findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => mapFinding((await apiClient.post(`/api/findings/${findingId}/re-alert`)).data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['findings', findingId], updated);
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-org'] });
    },
  });
}

// ---------- Mapping: closure KPIs ----------
// The real closure_kpis row has no finding_title column — it's joined in
// client-side from /api/findings so the UI still gets a real title.
function mapClosureKpi(raw: any, findingTitle: string | undefined): ClosureKpi {
  return {
    id: raw.id,
    findingId: raw.finding_id,
    findingTitle: findingTitle ?? '',
    name: raw.name,
    baseline: raw.baseline,
    target: raw.target,
    current: raw.current,
    progressPct: raw.progress_pct,
    status: raw.status,
    watchedByAgentName: raw.watched_by_agent_name,
    createdAt: raw.created_at,
    closedAt: raw.closed_at,
  };
}

export function useClosureKpis() {
  return useQuery({
    queryKey: ['closure-kpis'],
    queryFn: async (): Promise<ClosureKpi[]> => {
      const [closuresRes, findingsRes] = await Promise.all([
        apiClient.get('/api/closure-kpis'),
        apiClient.get('/api/findings'),
      ]);
      const rawFindings: any[] = findingsRes.data.findings ?? [];
      const findingsById = new Map<string, any>(rawFindings.map((f) => [f.id, f]));
      const rawClosures: any[] = closuresRes.data.closure_kpis ?? [];
      return rawClosures.map((c) => mapClosureKpi(c, findingsById.get(c.finding_id)?.title));
    },
    refetchInterval: 30_000,
  });
}

export function useCloseExitCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.post(`/api/closure-kpis/${id}/close`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closure-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-org'] });
    },
  });
}
