import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { ChaseEscalation, ExceptionStatus, RunDetail, RunException, RunListItem, RunStatus, TimelineStep } from './types';

// ---------- Real backend response shapes (subset of fields we use) ----------
// "Runs" map to /api/reports — the real backend has no other run-like entity.
interface ApiReport {
  id: string;
  title?: string;
  status?: string;
  content?: string;
  created_at: string;
  created_by?: string;
  [key: string]: unknown;
}

interface ApiUser {
  id: string;
  name: string;
  [key: string]: unknown;
}

const AVATAR_COLORS = ['#4f7cff', '#00b894', '#e17055', '#6c5ce7', '#00cec9', '#fdcb6e', '#e84393'];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function avatarBgFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function unwrap<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

// Reports carry a free-text `## Heading` markdown title for the agent/section that produced
// them; fall back to a generic label when none is found rather than guessing.
function firstHeading(content: string | undefined): string | null {
  if (!content) return null;
  const match = content.match(/^##\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/[*_`>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRunStatus(status: string | undefined): RunStatus {
  const s = (status ?? '').toLowerCase();
  if (s.includes('running') || s.includes('progress') || s.includes('pending')) return 'running';
  if (s.includes('fail') || s.includes('error')) return 'failed';
  if (s === 'complete' || s === 'completed') return 'completed';
  return 'completed';
}

async function fetchReportsAndUsers(): Promise<{ reports: ApiReport[]; users: ApiUser[] }> {
  const [reportsRes, usersRes] = await Promise.all([
    apiClient.get('/api/reports'),
    apiClient.get('/api/users'),
  ]);
  return {
    reports: unwrap<ApiReport>(reportsRes.data, 'reports'),
    users: unwrap<ApiUser>(usersRes.data, 'users'),
  };
}

function toRunListItem(report: ApiReport, usersById: Map<string, ApiUser>): RunListItem {
  const owner = report.created_by ? usersById.get(report.created_by) : undefined;
  const heading = firstHeading(report.content);

  return {
    id: report.id,
    name: report.title ?? heading ?? 'Report',
    owner: owner
      ? { name: owner.name, initials: initialsFor(owner.name), avatarBg: avatarBgFor(owner.id) }
      : null,
    agentName: heading ?? 'Multi-Agent Analysis',
    status: toRunStatus(report.status),
    // No completion timestamp exists on the real report model.
    duration: '—',
    outcome: report.content ? truncate(stripMarkdown(report.content), 100) : 'No outcome summary available.',
  };
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function useRuns(status: RunStatus | 'all' = 'all') {
  return useQuery({
    queryKey: ['runs', 'list', status],
    queryFn: async (): Promise<RunListItem[]> => {
      const { reports, users } = await fetchReportsAndUsers();
      const usersById = new Map(users.map((u) => [u.id, u]));
      const items = reports
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((r) => toRunListItem(r, usersById));
      return status === 'all' ? items : items.filter((r) => r.status === status);
    },
  });
}

export function useRunDetail(runId: string | undefined) {
  return useQuery({
    queryKey: ['runs', 'detail', runId],
    queryFn: async (): Promise<RunDetail | null> => {
      // No single-report endpoint exists — find it in the same list the table uses.
      const { reports, users } = await fetchReportsAndUsers();
      const usersById = new Map(users.map((u) => [u.id, u]));
      const report = reports.find((r) => r.id === runId);
      if (!report) return null;

      const runStatus = toRunStatus(report.status);
      const isLive = runStatus === 'running';
      const owner = report.created_by ? usersById.get(report.created_by) : undefined;
      const heading = firstHeading(report.content);

      // Honest single-step timeline reflecting the real status — not a fabricated
      // multi-stage pipeline the backend has no concept of.
      const step: TimelineStep = {
        id: report.id,
        status: isLive ? 'live' : runStatus === 'failed' ? 'gate' : 'done',
        label: heading ?? 'Report',
        description: report.status ? `Status: ${report.status}` : 'Status unavailable',
        duration: '—',
      };

      return {
        id: report.id,
        name: report.title ?? heading ?? 'Report',
        meta: owner ? `Owned by ${owner.name}` : 'No owner recorded',
        isLive,
        steps: [step],
      };
    },
    enabled: !!runId,
    refetchInterval: (query) => (query.state.data?.isLive ? 3000 : false),
  });
}

// ---------- Pause/resume: not supported by the real backend ----------
export function usePauseRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_runId: string): Promise<never> => {
      throw new Error('Pausing runs is not supported by the backend yet');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['runs'] }),
  });
}

export function useResumeRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_runId: string): Promise<never> => {
      throw new Error('Resuming runs is not supported by the backend yet');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['runs'] }),
  });
}

// ---------- Exceptions & chases: no equivalent on the real backend ----------
// The real API has no exception-log or SLA chase/escalation tracking. Returning an empty
// array (with no network call) is the honest result rather than fabricating data or a fake
// endpoint call that would 404.
export function useRunExceptions(_status: ExceptionStatus | 'all' = 'all') {
  return useQuery({
    queryKey: ['runs', 'exceptions', _status],
    queryFn: async (): Promise<RunException[]> => [],
  });
}

export function useResolveException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string): Promise<never> => {
      throw new Error('Exception tracking is not supported by the backend yet');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['runs', 'exceptions'] }),
  });
}

export function useRunChases() {
  return useQuery({
    queryKey: ['runs', 'chases'],
    queryFn: async (): Promise<ChaseEscalation[]> => [],
  });
}

export function useFlagRunFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_vars: { runId: string; text: string }): Promise<never> => {
      throw new Error('Chase & escalate feedback is not supported by the backend yet');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['runs', 'chases'] }),
  });
}
