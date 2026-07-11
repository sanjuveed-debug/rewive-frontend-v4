import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { getCurrentUser } from './auth';
import type { AgentCatalogEntry, AgentCatalogFilters, AgentFunction } from './types';

// ---------- Real backend shapes (FastAPI) ----------
interface ApiAgent {
  id: string;
  name: string;
  focus_area: string;
  category: string;
  max_turns: number;
  model: string;
  is_active: boolean;
  tool_names: string[];
}

interface ApiReport {
  id: string;
  title: string;
  status: string;
  created_by?: string;
  created_at: string;
  content: string;
}

// Tool names that read data vs. tools that produce/emit output — used to derive
// honest inputs/outputs summaries from each agent's real tool_names list.
const INPUT_TOOL_NAMES = new Set(['execute_sql', 'get_gl_balance', 'get_trial_balance']);
const OUTPUT_TOOL_NAMES = new Set(['create_visualization', 'summarize_report', 'export_to_excel', 'send_alert']);

async function fetchReports(): Promise<ApiReport[]> {
  try {
    const res = await apiClient.get<{ reports: ApiReport[] }>('/api/reports');
    return res.data.reports ?? [];
  } catch {
    // Reports aren't essential to the catalog — degrade to an honest "no data" state
    // rather than failing the whole agent list.
    return [];
  }
}

function mapAgent(agent: ApiAgent, reports: ApiReport[]): AgentCatalogEntry {
  const currentUser = getCurrentUser();
  const isLive = agent.is_active;
  const toolNames = agent.tool_names ?? [];

  // Best-effort real run count: reports authored by this agent, matched by name
  // against the report's `created_by` field (the real backend has no per-agent
  // run counter, so this is a derived approximation, not a fabricated number).
  const matchingReports = reports.filter((r) => (r.created_by ?? '').toLowerCase() === agent.name.toLowerCase());
  const lastMatching = matchingReports.length
    ? [...matchingReports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : undefined;

  const inputsSummary = toolNames.filter((t) => INPUT_TOOL_NAMES.has(t));
  const outputsSummary = toolNames.filter((t) => OUTPUT_TOOL_NAMES.has(t));

  return {
    agentId: agent.id,
    state: isLive ? 'live' : 'draft',
    name: agent.name,
    function: agent.category,
    capabilitiesCount: toolNames.length,
    dataInputs: 'Financial database',
    reviewGate: 'None',
    owner: {
      name: currentUser?.name ?? 'Rewive FP&A',
      initials: currentUser?.name
        ? currentUser.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
        : 'RF',
      avatarBg: 'var(--accent-soft)',
    },
    guardrails: 'None configured',
    estRuntime: '—',
    description: agent.focus_area,
    // Real org profile is a single FMCG organization, but AgentIndustry has no
    // 'fmcg' option — defaulting to 'general' rather than fabricating a mismatch.
    industry: 'general',
    function2: (agent.category as AgentFunction) ?? 'finance',
    persona: 'cfo',
    catalogStatus: isLive ? 'live' : 'draft',
    creationPath: 'chat',
    workflowId: undefined,
    inputsSummary: inputsSummary.length ? inputsSummary : toolNames,
    outputsSummary,
    roiToDate: { label: 'ROI', value: '—', direction: 'flat' },
    tokenCostToDate: { tokens: 0, estCost: '—' },
    runsCount: matchingReports.length,
    lastRunAt: lastMatching?.created_at ?? null,
    costBudget: undefined,
  };
}

function matchesFilters(entry: AgentCatalogEntry, filters: AgentCatalogFilters): boolean {
  if (filters.industry && filters.industry !== 'all' && entry.industry !== filters.industry) return false;
  if (filters.function && filters.function !== 'all' && entry.function2 !== filters.function) return false;
  if (filters.status && filters.status !== 'all' && entry.catalogStatus !== filters.status) return false;
  if (filters.agentType && filters.agentType !== 'all' && entry.creationPath !== filters.agentType) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (!entry.name.toLowerCase().includes(q) && !entry.description.toLowerCase().includes(q)) return false;
  }
  return true;
}

export function useAgentCatalog(filters: AgentCatalogFilters = {}) {
  return useQuery({
    queryKey: ['agents', 'catalog', filters],
    queryFn: async () => {
      const [agentsRes, reports] = await Promise.all([
        apiClient.get<{ agents: ApiAgent[] }>('/api/agents'),
        fetchReports(),
      ]);
      const agents = agentsRes.data.agents ?? [];
      return agents.map((a) => mapAgent(a, reports)).filter((entry) => matchesFilters(entry, filters));
    },
  });
}

export function useAgentCatalogEntry(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agents', 'catalog-detail', agentId],
    queryFn: async () => {
      const [agentsRes, reports] = await Promise.all([
        apiClient.get<{ agents: ApiAgent[] }>('/api/agents'),
        fetchReports(),
      ]);
      const agents = agentsRes.data.agents ?? [];
      const found = agents.find((a) => a.id === agentId);
      if (!found) throw new Error(`Agent not found: ${agentId}`);
      return mapAgent(found, reports);
    },
    enabled: !!agentId,
  });
}
