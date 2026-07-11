import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { LeaderboardHighlight, LeaderboardRow } from './types';

// ---------- Real backend response shapes (subset of fields we use) ----------
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

interface ApiAgent {
  id: string;
  name: string;
  focus_area: string | null;
  category: string | null;
  max_turns: number | null;
  model: string | null;
  is_active: boolean;
  tool_names: string[] | null;
}

interface ApiTask {
  id: string;
  status: 'Created' | 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined' | 'Overdue';
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
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

// 6 real weekly buckets (oldest -> newest), counting completed tasks per week.
function weeklyTrend(completedDates: number[]): number[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = new Array(6).fill(0);
  for (const t of completedDates) {
    const weeksAgo = Math.floor((now - t) / weekMs);
    const bucketIndex = 5 - weeksAgo;
    if (bucketIndex >= 0 && bucketIndex < 6) buckets[bucketIndex]++;
  }
  return buckets;
}

function trendColorFor(trend: number[]): string {
  const first = trend[0] ?? 0;
  const last = trend[trend.length - 1] ?? 0;
  if (last > first) return 'green';
  if (last < first) return 'red';
  return 'accent';
}

async function fetchLeaderboardRows(): Promise<LeaderboardRow[]> {
  const [usersRes, agentsRes, tasksRes] = await Promise.all([
    apiClient.get<{ users: ApiUser[] }>('/api/users'),
    apiClient.get<{ agents: ApiAgent[] }>('/api/agents'),
    apiClient.get<{ tasks: ApiTask[] }>('/api/tasks'),
  ]);

  const tasks = tasksRes.data.tasks;

  const humanRows: LeaderboardRow[] = usersRes.data.users.map((user) => {
    const userTasks = tasks.filter((t) => t.assigned_to === user.id);
    const completedTasks = userTasks.filter((t) => t.status === 'Completed');
    const declinedTasks = userTasks.filter((t) => t.status === 'Declined');
    const actionsClosed = completedTasks.length;

    const comparable = completedTasks.filter((t) => t.due_date && t.completed_at);
    const onTime = comparable.filter(
      (t) => new Date(t.completed_at as string).getTime() <= new Date(t.due_date as string).getTime()
    );
    const onTimePct = comparable.length > 0 ? Math.round((onTime.length / comparable.length) * 100) : 0;

    const decidedCount = completedTasks.length + declinedTasks.length;
    const decisionWinRatePct = decidedCount > 0 ? Math.round((completedTasks.length / decidedCount) * 100) : 0;

    const timeSaved = `${Math.round(actionsClosed * 0.5)}h`;

    const completedTimes = completedTasks
      .filter((t) => t.completed_at)
      .map((t) => new Date(t.completed_at as string).getTime());
    const trend = weeklyTrend(completedTimes);

    return {
      id: user.id,
      type: 'human',
      name: user.name,
      initials: initialsFor(user.name),
      avatarBg: avatarBgFor(user.name),
      actionsClosed,
      onTimePct,
      decisionWinRatePct,
      timeSaved,
      trend,
      trendColor: trendColorFor(trend),
    };
  });

  // The task schema's assigned_to is always a human user id (or null) — there is no
  // per-agent task attribution in this data model, so agent rows are honestly zeroed
  // rather than fabricating activity.
  const agentRows: LeaderboardRow[] = agentsRes.data.agents.map((agent) => ({
    id: agent.id,
    type: 'agent',
    name: agent.name,
    initials: initialsFor(agent.name),
    avatarBg: avatarBgFor(agent.name),
    actionsClosed: 0,
    onTimePct: 0,
    decisionWinRatePct: 0,
    timeSaved: '0h',
    trend: [0, 0, 0, 0, 0, 0],
    trendColor: 'accent',
  }));

  return [...humanRows, ...agentRows];
}

export function useLeaderboard(type: 'all' | 'human' | 'agent' = 'all') {
  return useQuery({
    queryKey: ['leaderboard', 'rows'],
    queryFn: fetchLeaderboardRows,
    select: (rows) => (type === 'all' ? rows : rows.filter((r) => r.type === type)),
  });
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function useLeaderboardHighlights() {
  return useQuery({
    queryKey: ['leaderboard', 'highlights'],
    queryFn: async (): Promise<LeaderboardHighlight[]> => {
      const rows = await fetchLeaderboardRows();
      const topHumans = rows
        .filter((r) => r.type === 'human')
        .sort((a, b) => b.actionsClosed - a.actionsClosed)
        .slice(0, 3);

      return topHumans.map((row, i) => ({
        id: row.id,
        medal: MEDALS[i] ?? '🏅',
        tag: i === 0 ? 'Top performer' : i === 1 ? 'Runner-up' : 'Third place',
        name: row.name,
        avatarBg: row.avatarBg,
        initials: row.initials,
        statLine: `${row.actionsClosed} actions closed · ${row.decisionWinRatePct}% win rate`,
      }));
    },
  });
}
