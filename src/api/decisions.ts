import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { DecisionLedgerItem, DecisionStats, Verdict } from './types';

// ---------- Real backend response shapes (subset of fields we use) ----------
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

// Heuristic-only: the real API has no category/function field on tasks or alerts, so
// we infer a rough business function from keywords in the title/message text.
function inferFunction(text: string): 'finance' | 'hr' | 'procurement' {
  const lower = text.toLowerCase();
  if (/\bhire|hiring|staff|payroll|onboard|recruit\b/.test(lower)) return 'hr';
  if (/\bvendor|procurement|supplier|purchase order|po\b/.test(lower)) return 'procurement';
  return 'finance';
}

function taskToDecision(task: ApiTask): DecisionLedgerItem {
  const verdict: Verdict = task.status === 'Completed' ? 'worked' : 'not_worked';
  const madeBy = task.assigned_to_name
    ? {
        type: 'human' as const,
        name: task.assigned_to_name,
        initials: initialsFor(task.assigned_to_name),
        avatarBg: avatarBgFor(task.assigned_to_name),
      }
    : { type: 'agent' as const, name: 'AI Analysis' };

  return {
    id: `task-${task.id}`,
    title: task.title,
    subtitle: task.description ?? `${task.priority ?? 'Normal'} priority`,
    madeBy,
    informedBy: { type: 'agent', name: task.source_report ? 'AI Report' : 'Manual review' },
    date: task.completed_at ?? task.created_at,
    verdict,
    // No real measured-$ impact is tracked for tasks yet.
    measuredImpact: { text: '—', direction: 'flat' },
    originatingSignalId: undefined,
    assessorNote: undefined,
  };
}

function alertToDecision(alert: ApiAlert): DecisionLedgerItem {
  return {
    id: `alert-${alert.id}`,
    title: alert.message,
    subtitle: alert.source ?? `${alert.severity} severity alert`,
    // A resolved alert has no distinct "resolver" identity in this data model beyond
    // resolved_by (a user id, not a name) — attribute it to the AI monitoring layer.
    madeBy: { type: 'agent', name: 'AI Monitoring' },
    informedBy: { type: 'agent', name: 'AI Report' },
    date: alert.resolved_at ?? alert.created_at,
    // A resolved alert is, by definition, an acted-on decision.
    verdict: 'worked',
    measuredImpact: { text: '—', direction: 'flat' },
    originatingSignalId: undefined,
    assessorNote: undefined,
  };
}

export interface DecisionLedgerFilters {
  function?: 'all' | 'finance' | 'hr' | 'procurement';
  verdict?: 'all' | 'worked' | 'not_worked';
}

async function fetchDecisionLedger(): Promise<DecisionLedgerItem[]> {
  const [tasksRes, alertsRes] = await Promise.all([
    apiClient.get<{ tasks: ApiTask[] }>('/api/tasks'),
    apiClient.get<{ alerts: ApiAlert[] }>('/api/alerts'),
  ]);

  const taskDecisions = tasksRes.data.tasks
    .filter((t) => t.status === 'Completed' || t.status === 'Declined')
    .map(taskToDecision);

  const alertDecisions = alertsRes.data.alerts
    .filter((a) => a.status === 'Resolved')
    .map(alertToDecision);

  return [...taskDecisions, ...alertDecisions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function useDecisionLedger(filters: DecisionLedgerFilters = {}) {
  return useQuery({
    queryKey: ['decisions', 'ledger'],
    queryFn: fetchDecisionLedger,
    select: (data) => {
      let out = data;
      if (filters.function && filters.function !== 'all') {
        out = out.filter((d) => inferFunction(`${d.title} ${d.subtitle}`) === filters.function);
      }
      if (filters.verdict && filters.verdict !== 'all') {
        out = out.filter((d) => d.verdict === filters.verdict);
      }
      return out;
    },
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatDuration(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function useDecisionStats() {
  return useQuery({
    queryKey: ['decisions', 'stats'],
    queryFn: async (): Promise<DecisionStats> => {
      const decisions = await fetchDecisionLedger();

      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const trackedQtd = decisions.filter((d) => {
        const dt = new Date(d.date);
        return dt.getFullYear() === now.getFullYear() && Math.floor(dt.getMonth() / 3) === currentQuarter;
      }).length;

      const worked = decisions.filter((d) => d.verdict === 'worked').length;
      const notWorked = decisions.filter((d) => d.verdict === 'not_worked').length;
      const total = worked + notWorked;
      const winRate = total > 0 ? Math.round((worked / total) * 100) : 0;

      const tasksRes = await apiClient.get<{ tasks: ApiTask[] }>('/api/tasks');
      const decisionTimes = tasksRes.data.tasks
        .filter((t) => (t.status === 'Completed' || t.status === 'Declined') && t.completed_at)
        .map((t) => new Date(t.completed_at as string).getTime() - new Date(t.created_at).getTime())
        .filter((ms) => ms >= 0);
      const medianMs = median(decisionTimes);

      return {
        trackedQtd: { value: trackedQtd, delta: { label: 'no prior period data', direction: 'flat' } },
        winRate: { value: `${winRate}%`, delta: { label: 'no prior period data', direction: 'flat' } },
        medianTimeToDecision: {
          value: decisionTimes.length > 0 ? formatDuration(medianMs) : '—',
          delta: { label: 'no prior period data', direction: 'flat' },
        },
        // No real $ impact tracking exists yet — reported honestly rather than fabricated.
        measuredImpactQtd: { value: '—', delta: { label: 'no prior period data', direction: 'flat' } },
      };
    },
  });
}

export function useApproveDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (decisionId: string) =>
      (await apiClient.put(`/api/alerts/${decisionId}/status`, { status: 'Resolved' })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
