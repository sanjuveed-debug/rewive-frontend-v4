import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { getCurrentUser } from './auth';
import type {
  CurrentUser,
  DashboardSummary,
  FindingSeverity,
  FindingStatus,
  PendingDecision,
  Persona,
  PulseItem,
  LiveRunSummary,
  TopPerformer,
} from './types';

// ---------- Real backend response shapes (subset of fields we use) ----------
// Mirrors the shapes used in src/api/decisions.ts, which already talks to this same backend.
interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  status: 'Created' | 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined' | 'Overdue';
  assigned_to: string | null;
  assigned_by: string | null;
  priority: string | null;
  due_date: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  source_report: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
}

interface ApiAlert {
  id: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  status: 'Unresolved' | 'Investigating' | 'Resolved';
  source: string | null;
  task_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface ApiAgent {
  id: string;
  name: string;
  is_active?: boolean;
  [key: string]: unknown;
}

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
  email?: string;
  [key: string]: unknown;
}

interface ApiKpiBlock {
  actual: number;
  budget: number;
  variance_pct: number;
}

interface ApiKpis {
  year: number;
  revenue: ApiKpiBlock;
  gross_profit: ApiKpiBlock;
  ebitda: ApiKpiBlock;
  net_profit: ApiKpiBlock;
}

interface ApiFinding {
  id: string;
  title: string;
  summary: string;
  raised_by_agent_id: string;
  raised_by_agent_name: string;
  stream_key: string;
  severity: FindingSeverity;
  status: FindingStatus;
  detected_at: string;
}

// ---------- Shared helpers ----------
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

// Real list endpoints wrap their array in an object keyed by resource name (see /api/tasks,
// /api/alerts in decisions.ts). Accept either shape defensively.
function unwrap<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(text: string, max: number) {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SEVERITY_ICON: Record<ApiAlert['severity'], string> = { high: '🔴', medium: '🟠', low: '🟡' };
const SEVERITY_ICON_BG: Record<ApiAlert['severity'], string> = {
  high: 'var(--red-soft)',
  medium: 'var(--amber-soft)',
  low: 'var(--teal-soft)',
};

// ---------- Current user (no /me on the real backend — derive from the local session) ----------
export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<CurrentUser> => {
      const user = getCurrentUser();
      const name = user?.name ?? 'there';
      return {
        name,
        initials: initialsFor(name),
        avatarBg: avatarBgFor(name),
        role: user?.role ?? 'Super Admin',
        // The real backend is single-org with no persona-scoping concept — every user is
        // effectively a Super Admin. We treat everyone as admin and default the lens to CFO
        // (closest fit for an FP&A tool) rather than fabricate per-user persona logic.
        isAdmin: true,
        defaultPersona: 'cfo',
      };
    },
    staleTime: Infinity,
  });
}

// ---------- Dashboard summary ----------
export function useDashboardSummary(persona?: Persona | 'all') {
  return useQuery({
    // `persona` has no effect on the real backend (single-org, no scoping) — kept in the key/signature
    // only so callers written against the old contract keep compiling.
    queryKey: ['dashboard', 'summary', persona],
    queryFn: async (): Promise<DashboardSummary> => {
      const [kpisRes, tasksRes, agentsRes, alertsRes] = await Promise.all([
        apiClient.get<ApiKpis>('/api/kpis'),
        apiClient.get('/api/tasks'),
        apiClient.get('/api/agents'),
        apiClient.get('/api/alerts/active'),
      ]);

      const kpis = kpisRes.data;
      const tasks = unwrap<ApiTask>(tasksRes.data, 'tasks');
      const agents = unwrap<ApiAgent>(agentsRes.data, 'agents');
      const activeAlerts = unwrap<ApiAlert>(alertsRes.data, 'alerts');

      const user = getCurrentUser();
      const greetingName = (user?.name ?? 'there').split(' ')[0];

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

      const completedToday = tasks.filter(
        (t) => t.status === 'Completed' && t.completed_at && new Date(t.completed_at) >= startOfToday
      ).length;
      const completedThisWeek = tasks.filter(
        (t) => t.status === 'Completed' && t.completed_at && new Date(t.completed_at) >= startOfWeek
      ).length;
      const assignedPending = tasks.filter((t) => t.status === 'Assigned').length;
      // is_active isn't guaranteed on every deployment of this endpoint — if it's missing,
      // treat the agent as active rather than silently zeroing the count.
      const agentsActiveNow = agents.filter((a) => a.is_active !== false).length;

      const comparable = tasks.filter((t) => t.status === 'Completed' && t.due_date && t.completed_at);
      const onTimeCount = comparable.filter(
        (t) => new Date(t.completed_at as string).getTime() <= new Date(t.due_date as string).getTime()
      ).length;
      const onTimeExecution = comparable.length > 0 ? `${Math.round((onTimeCount / comparable.length) * 100)}%` : '—';

      const variancePct = kpis?.revenue?.variance_pct;
      const varianceText =
        typeof variancePct === 'number'
          ? `Revenue is ${variancePct >= 0 ? 'up' : 'down'} ${Math.abs(variancePct).toFixed(1)}% vs budget`
          : 'Revenue variance not available';
      const summarySentence = `${varianceText}, with ${activeAlerts.length} active alert${activeAlerts.length === 1 ? '' : 's'} needing attention.`;

      const flatDelta = { label: 'no prior period data', direction: 'flat' as const };

      return {
        greetingName,
        summarySentence,
        kpis: {
          actionsExecutedToday: { value: completedToday, delta: flatDelta },
          decisionsPending: { value: activeAlerts.length + assignedPending, delta: flatDelta },
          agentsActiveNow: { value: agentsActiveNow, delta: flatDelta },
          timeSavedThisWeek: { value: `${Math.round(completedThisWeek * 0.5)}h`, delta: flatDelta },
          onTimeExecution: { value: onTimeExecution, delta: flatDelta },
        },
      };
    },
  });
}

// ---------- Pending decisions (active alerts) ----------
export function usePendingDecisions(persona?: Persona | 'all') {
  return useQuery({
    // persona has no effect on the real backend — see note in useDashboardSummary.
    queryKey: ['decisions', 'pending', persona],
    queryFn: async (): Promise<PendingDecision[]> => {
      const { data } = await apiClient.get('/api/alerts/active');
      const alerts = unwrap<ApiAlert>(data, 'alerts');

      return alerts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((a) => ({
          id: a.id,
          icon: SEVERITY_ICON[a.severity] ?? '🟡',
          iconBg: SEVERITY_ICON_BG[a.severity] ?? 'var(--teal-soft)',
          title: truncate(a.message, 90),
          subtitle: `${a.source ?? 'System'} · ${relativeTime(a.created_at)}`,
          actionLabel: 'Resolve',
          actionVerb: 'approve',
          // No persona-scoping concept on the real backend — CFO is the closest fit for this
          // FP&A tool, so every item is hardcoded to that lens rather than fabricating per-item logic.
          persona: 'cfo',
        }));
    },
  });
}

// ---------- Company pulse (merged recent activity) ----------
export function usePulse() {
  return useQuery({
    queryKey: ['pulse'],
    queryFn: async (): Promise<PulseItem[]> => {
      const [tasksRes, alertsRes, reportsRes] = await Promise.all([
        apiClient.get('/api/tasks'),
        apiClient.get('/api/alerts/active'),
        apiClient.get('/api/reports'),
      ]);

      const tasks = unwrap<ApiTask>(tasksRes.data, 'tasks');
      const alerts = unwrap<ApiAlert>(alertsRes.data, 'alerts');
      const reports = unwrap<ApiReport>(reportsRes.data, 'reports');

      const merged: (PulseItem & { createdAt: string })[] = [
        ...tasks.map((t) => ({
          id: `task-${t.id}`,
          createdAt: t.created_at,
          dotColor: 'var(--accent)',
          html: `<b>${escapeHtml(t.title)}</b> — task ${escapeHtml(t.status.toLowerCase())}${
            t.assigned_to_name ? ` · ${escapeHtml(t.assigned_to_name)}` : ''
          }`,
        })),
        ...alerts.map((a) => ({
          id: `alert-${a.id}`,
          createdAt: a.created_at,
          dotColor: a.severity === 'high' ? 'var(--red)' : a.severity === 'medium' ? 'var(--amber)' : 'var(--teal)',
          html: `<b>${escapeHtml(a.message)}</b>${a.source ? ` — ${escapeHtml(a.source)}` : ''}`,
        })),
        ...reports.map((r) => ({
          id: `report-${r.id}`,
          createdAt: r.created_at,
          dotColor: 'var(--green)',
          html: `<b>${escapeHtml(r.title ?? 'Report generated')}</b>`,
        })),
      ];

      return merged
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8)
        .map(({ id, dotColor, html }) => ({ id, dotColor, html }));
    },
  });
}

// ---------- Live runs (reports still in flight) ----------
function isRunningStatus(status: string | undefined): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('running') || s.includes('progress') || s.includes('pending');
}

export function useLiveRuns() {
  return useQuery({
    queryKey: ['runs', 'live'],
    queryFn: async (): Promise<LiveRunSummary[]> => {
      const { data } = await apiClient.get('/api/reports');
      const reports = unwrap<ApiReport>(data, 'reports');

      // An empty array is a correct, honest result when nothing is actually running —
      // there's no fake in-progress run to show.
      return reports
        .filter((r) => isRunningStatus(r.status))
        .map((r) => ({
          id: r.id,
          name: r.title ?? 'Report run',
          // No real ETA/progress-percent is tracked by the backend — report the honest
          // status text instead of fabricating a countdown or a fake bar fill.
          eta: '—',
          percent: 0,
          stepDescription: `Status: ${r.status}`,
        }));
    },
    refetchInterval: 4000,
  });
}

// ---------- Top performer ----------
export function useTopPerformer(period: 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['people', 'top-performer', period],
    queryFn: async (): Promise<TopPerformer | null> => {
      const [usersRes, tasksRes] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get('/api/tasks'),
      ]);
      const users = unwrap<ApiUser>(usersRes.data, 'users');
      const tasks = unwrap<ApiTask>(tasksRes.data, 'tasks');

      const windowStart = new Date();
      if (period === 'week') windowStart.setDate(windowStart.getDate() - 7);
      else windowStart.setMonth(windowStart.getMonth() - 1);

      const counts = new Map<string, number>();
      for (const t of tasks) {
        if (t.status === 'Completed' && t.completed_at && t.assigned_to && new Date(t.completed_at) >= windowStart) {
          counts.set(t.assigned_to, (counts.get(t.assigned_to) ?? 0) + 1);
        }
      }

      let topUserId: string | null = null;
      let topCount = 0;
      for (const [userId, count] of counts) {
        if (count > topCount) {
          topCount = count;
          topUserId = userId;
        }
      }
      if (!topUserId || topCount === 0) return null;

      const user = users.find((u) => u.id === topUserId);
      const fallbackName = tasks.find((t) => t.assigned_to === topUserId)?.assigned_to_name;
      const name = user?.name ?? fallbackName ?? 'Unknown';

      return {
        id: topUserId,
        name,
        avatarBg: avatarBgFor(name),
        initials: initialsFor(name),
        badge: `${topCount} completed`,
        statLine: `${topCount} task${topCount === 1 ? '' : 's'} completed this ${period}`,
      };
    },
  });
}

// ---------- Command Center findings feed ----------
// Lightweight projection of /api/findings for the dashboard widget — deliberately not the full
// `Finding` type from types.ts (that contract includes disposition/escalation/impact-path fields
// the real /api/findings response does not provide, and this widget must not fabricate them).
export interface DashboardFindingItem {
  id: string;
  title: string;
  summary: string;
  severity: FindingSeverity;
  status: FindingStatus;
  raisedByAgentName: string;
  detectedAt: string;
}

export function useDashboardFindings(status: FindingStatus | 'all' = 'open') {
  return useQuery({
    queryKey: ['dashboard', 'findings', status],
    queryFn: async (): Promise<DashboardFindingItem[]> => {
      const { data } = await apiClient.get('/api/findings', {
        params: status !== 'all' ? { status } : undefined,
      });
      const findings = unwrap<ApiFinding>(data, 'findings');
      return findings
        .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())
        .map((f) => ({
          id: f.id,
          title: f.title,
          summary: f.summary,
          severity: f.severity,
          status: f.status,
          raisedByAgentName: f.raised_by_agent_name,
          detectedAt: f.detected_at,
        }));
    },
  });
}
