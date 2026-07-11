import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { getCurrentUser } from './auth';
import type { OutcomeReport, ScoreCard, OutcomeInsight, RecommendedAction } from './types';

// ---------- Real backend shapes (FastAPI) ----------
interface ApiReport {
  id: string;
  title: string;
  status: string;
  created_by: string;
  created_at: string;
  content: string;
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

interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string | null;
  priority: string;
  due_date: string | null;
  assigned_to_name: string | null;
  completed_at: string | null;
  source_report: string | null;
  [key: string]: unknown;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Generated recently';
  const diffMs = Date.now() - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'Generated just now';
  if (diffMin < 60) return `Generated ${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Generated ${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `Generated ${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const diffMonth = Math.round(diffDay / 30);
  return `Generated ${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
}

function deltaTone(variancePct: number): 'green' | 'red' | 'amber' {
  if (variancePct >= 5) return 'green';
  if (variancePct <= -5) return 'red';
  return 'amber';
}

function buildScoreCard(id: string, label: string, block: ApiKpiBlock): ScoreCard {
  const tone = deltaTone(block.variance_pct);
  return {
    id,
    label,
    value: currencyFormatter.format(block.actual),
    deltaLabel: `${block.variance_pct >= 0 ? '+' : ''}${block.variance_pct}% vs budget`,
    deltaTone: tone,
    sparkline: [block.budget, block.actual],
    sparklineColor: tone === 'green' ? 'var(--green)' : tone === 'red' ? 'var(--red)' : 'var(--amber)',
  };
}

const SECTION_EMOJI_RE = /^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u;
const HEADING_NUMBERING_RE = /^[\s#*_.\-\d]+/;

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseInsightsFromContent(content: string): OutcomeInsight[] {
  // Split on level-2 headings ("## "), skipping a leading agent-name banner heading.
  const parts = content.split(/\n(?=##\s)/g);
  const sections = parts.filter((p) => /^##\s/.test(p.trim()));
  const insights: OutcomeInsight[] = [];
  const iconBgs = ['var(--accent-soft)', 'var(--green-soft)', 'var(--amber-soft)', 'var(--teal-soft)'];

  let index = 0;
  for (const section of sections) {
    if (insights.length >= 4) break;
    const lines = section.trim().split('\n');
    const headingLine = lines[0].replace(/^##\s*/, '').trim();
    const body = lines.slice(1).join('\n').trim();

    // Skip a leading agent-name banner heading (very short, no body content beyond a `---` divider).
    const bodyStripped = body.replace(/^-+\s*$/gm, '').trim();
    if (index === 0 && bodyStripped.length < 20) {
      index += 1;
      continue;
    }

    const emojiMatch = headingLine.match(SECTION_EMOJI_RE);
    const icon = emojiMatch ? emojiMatch[1] : '📊';
    const title = headingLine.replace(SECTION_EMOJI_RE, '').replace(HEADING_NUMBERING_RE, '').trim() || headingLine;
    const text = stripMarkdown(bodyStripped).slice(0, 200);

    insights.push({
      id: `insight-${index}`,
      icon,
      iconBg: iconBgs[insights.length % iconBgs.length],
      title,
      text,
    });
    index += 1;
  }

  return insights;
}

async function fetchOutcomeBundle(runId: string) {
  const [reportsRes, kpisRes, tasksRes] = await Promise.all([
    apiClient.get<{ reports: ApiReport[] }>('/api/reports'),
    apiClient.get<ApiKpis>('/api/kpis'),
    apiClient.get<{ tasks: ApiTask[] }>('/api/tasks'),
  ]);

  const reports = reportsRes.data.reports ?? [];
  const report =
    runId === 'latest'
      ? [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : reports.find((r) => r.id === runId);

  if (!report) {
    throw new Error(`Outcome report not found for runId "${runId}"`);
  }

  const kpis = kpisRes.data;
  const tasks = tasksRes.data.tasks ?? [];

  const scoreCards: ScoreCard[] = [
    buildScoreCard('revenue', 'Revenue', kpis.revenue),
    buildScoreCard('gross_profit', 'Gross Profit', kpis.gross_profit),
    buildScoreCard('ebitda', 'EBITDA', kpis.ebitda),
    buildScoreCard('net_profit', 'Net Profit', kpis.net_profit),
  ];

  const insights = parseInsightsFromContent(report.content ?? '');

  const actions: RecommendedAction[] = tasks
    .filter((t) => t.source_report === report.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: t.description,
      assigned: !!t.assigned_to,
      assignedTo: t.assigned_to_name ?? undefined,
      actionType: 'assign',
    }));

  const outcome: OutcomeReport = {
    runId: report.id,
    title: report.title,
    runMeta: formatRelativeTime(report.created_at),
    published: report.status === 'complete',
    scoreCards,
    insights,
    actions,
  };

  return outcome;
}

export function useOutcomeReport(runId: string) {
  return useQuery({
    queryKey: ['outcomes', runId],
    queryFn: () => fetchOutcomeBundle(runId),
  });
}

// The real endpoint is keyed by the underlying task id, and assigns to the current user.
export function useAssignAction(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (actionId: string) => {
      const currentUser = getCurrentUser();
      if (!currentUser) throw new Error('No signed-in user to assign this action to.');
      return (
        await apiClient.put(`/api/tasks/${actionId}/assign`, {
          user_id: currentUser.id,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outcomes', runId] });
    },
  });
}

// No real export endpoint exists on the backend. This builds a genuine client-side
// download from the real report markdown content — no network call to a fake endpoint.
export function useExportOutcome(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (format: 'md' | 'pdf') => {
      // Reuse the already-fetched outcome bundle if present, otherwise fetch fresh.
      const cached = queryClient.getQueryData<OutcomeReport>(['outcomes', runId]);
      const reportsRes = await apiClient.get<{ reports: ApiReport[] }>('/api/reports');
      const reports = reportsRes.data.reports ?? [];
      const report =
        runId === 'latest'
          ? [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : reports.find((r) => r.id === runId) ?? reports.find((r) => r.id === cached?.runId);

      if (!report) throw new Error('Could not find the report content to export.');

      if (format === 'pdf') {
        window.print();
        return { downloaded: true, format };
      }

      const blob = new Blob([report.content ?? ''], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/[^a-z0-9\-_]+/gi, '_')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { downloaded: true, format };
    },
  });
}

// No real backend share-link endpoint exists. Kept exported so imports don't break, but this
// always rejects — the Outcomes screen disables/hides the Share button rather than faking success.
export function useShareOutcome(runId: string) {
  return useMutation({
    mutationFn: async (): Promise<{ shareUrl: string; expiresInDays: number }> => {
      void runId;
      throw new Error('Sharing is not supported yet');
    },
  });
}
