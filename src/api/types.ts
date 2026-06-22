// Shared types matching the Rewive API contract (see plan doc for full endpoint list).

export type Delta = {
  label: string;
  direction: 'up' | 'down' | 'flat';
};

export interface DashboardSummary {
  greetingName: string;
  summarySentence: string;
  kpis: {
    actionsExecutedToday: { value: number; delta: Delta };
    decisionsPending: { value: number; delta: Delta };
    agentsActiveNow: { value: number; delta: Delta };
    timeSavedThisWeek: { value: string; delta: Delta };
    onTimeExecution: { value: string; delta: Delta };
  };
}

export interface PendingDecision {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionVerb: 'approve' | 'act' | 'clear' | 'release';
}

export interface PulseItem {
  id: string;
  dotColor: string;
  html: string;
}

export interface LiveRunSummary {
  id: string;
  name: string;
  eta: string;
  percent: number;
  barColor?: string;
  stepDescription: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  avatarBg: string;
  initials: string;
  badge: string;
  statLine: string;
}

export type RunStatus = 'running' | 'needs_decision' | 'completed' | 'failed';

export interface RunListItem {
  id: string;
  name: string;
  owner: { name: string; initials: string; avatarBg: string } | null;
  agentName: string;
  status: RunStatus;
  duration: string;
  outcome: string;
}

export type TimelineStepStatus = 'done' | 'live' | 'wait' | 'gate';

export interface TimelineStep {
  id: string;
  status: TimelineStepStatus;
  label: string;
  description: string;
  duration: string;
  icon?: string;
}

export interface RunDetail {
  id: string;
  name: string;
  meta: string;
  isLive: boolean;
  steps: TimelineStep[];
}

export interface DecisionStats {
  trackedQtd: { value: number; delta: Delta };
  winRate: { value: string; delta: Delta };
  medianTimeToDecision: { value: string; delta: Delta };
  measuredImpactQtd: { value: string; delta: Delta };
}

export type Verdict = 'worked' | 'not_worked' | 'too_early';

export interface DecisionLedgerItem {
  id: string;
  title: string;
  subtitle: string;
  madeBy: { type: 'human' | 'agent'; name: string; initials?: string; avatarBg?: string };
  informedBy: { type: 'agent' | 'policy'; name: string };
  date: string;
  verdict: Verdict;
  measuredImpact: { text: string; direction: 'up' | 'down' | 'flat' };
}

export interface LeaderboardHighlight {
  id: string;
  medal: string;
  tag: string;
  name: string;
  avatarBg: string;
  initials: string;
  statLine: string;
}

export interface LeaderboardRow {
  id: string;
  type: 'human' | 'agent';
  name: string;
  initials: string;
  avatarBg: string;
  actionsClosed: number;
  onTimePct: number;
  decisionWinRatePct: number;
  timeSaved: string;
  trend: number[];
  trendColor: string;
}

export interface ScoreCard {
  id: string;
  label: string;
  value: string;
  deltaLabel: string;
  deltaTone: 'green' | 'red' | 'amber';
  sparkline: number[];
  sparklineColor: string;
}

export interface OutcomeInsight {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  text: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  subtitle: string;
  assigned: boolean;
  assignedTo?: string;
  actionType: 'assign' | 'schedule';
}

export interface OutcomeReport {
  runId: string;
  title: string;
  runMeta: string;
  published: boolean;
  scoreCards: ScoreCard[];
  insights: OutcomeInsight[];
  actions: RecommendedAction[];
}

export type AgentBuilderStepType = 'capabilities' | 'data_context' | 'plan';

export interface AgentBuilderChoice {
  id: string;
  label: string;
  selected: boolean;
}

export interface AgentBuilderPlanStep {
  n: number;
  text: string;
}

export interface AgentBuilderMessage {
  id: string;
  role: 'user' | 'bot';
  stepType?: AgentBuilderStepType;
  stepLabel?: string;
  text?: string;
  choices?: AgentBuilderChoice[];
  plan?: {
    name: string;
    estRuntime: string;
    steps: AgentBuilderPlanStep[];
  };
}

export interface AgentBuilderSession {
  sessionId: string;
  messages: AgentBuilderMessage[];
  detectedTemplate?: string;
}

export interface AgentPreview {
  agentId: string;
  state: 'draft' | 'live';
  name: string;
  function: string;
  capabilitiesCount: number;
  dataInputs: string;
  reviewGate: string;
  owner: { name: string; initials: string; avatarBg: string };
  guardrails: string;
  estRuntime: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number };
}
