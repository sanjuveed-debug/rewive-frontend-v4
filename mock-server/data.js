// Seed data mirroring the original static prototype, used by the mock API server.

export const dashboardSummary = {
  greetingName: 'Kumara',
  summarySentence:
    'Since yesterday, Rewive executed <b style="color:var(--ink)">87 actions</b> across Finance and HR. <b style="color:var(--ink)">4 decisions</b> are waiting on you.',
  kpis: {
    actionsExecutedToday: { value: 87, delta: { label: '▲ 12% vs yesterday', direction: 'up' } },
    decisionsPending: { value: 4, delta: { label: '2 urgent', direction: 'flat' } },
    agentsActiveNow: { value: 12, delta: { label: '3 running', direction: 'flat' } },
    timeSavedThisWeek: { value: '41h', delta: { label: '▲ 9h vs last week', direction: 'up' } },
    onTimeExecution: { value: '94%', delta: { label: '▲ 2 pts', direction: 'up' } },
  },
};

export let pendingDecisions = [
  {
    id: 'dec1',
    icon: '📊',
    iconBg: 'var(--amber-soft)',
    title: 'FP&A Margin Run · variance commentary ready',
    subtitle: 'Profitability Agent · needs approval before it reaches the board pack',
    actionLabel: 'Approve',
    actionVerb: 'approve',
  },
  {
    id: 'dec2',
    icon: '⚠️',
    iconBg: 'var(--red-soft)',
    title: 'Pricing anomaly · SKU 4417 margin −6.2% in KSA',
    subtitle: 'Anomaly Agent recommends repricing · est. impact +$84k / qtr',
    actionLabel: 'Act',
    actionVerb: 'act',
  },
  {
    id: 'dec3',
    icon: '🧾',
    iconBg: 'var(--teal-soft)',
    title: 'Month-end close · 2 reconciliation exceptions',
    subtitle: 'Close Agent paused at review gate · waiting 3h 12m',
    actionLabel: 'Clear',
    actionVerb: 'clear',
  },
  {
    id: 'dec4',
    icon: '👥',
    iconBg: 'var(--accent-soft)',
    title: 'HR Screening · 14 candidates shortlisted for review',
    subtitle: 'Screening Agent · confidence 92% · Devaki tagged as reviewer',
    actionLabel: 'Release',
    actionVerb: 'release',
  },
];

export const pulse = [
  {
    id: 'p1',
    dotColor: 'var(--green)',
    html: '<b>78% of decisions</b> made through Rewive this quarter are confirmed as <b>worked</b> — up from 61% last quarter.',
  },
  {
    id: 'p2',
    dotColor: 'var(--accent)',
    html: '<b>Finance</b> is the fastest function: median time-to-decision down from <b>2.1 days to 4 hours</b>.',
  },
  {
    id: 'p3',
    dotColor: 'var(--amber)',
    html: '<b>3 actions</b> from last week\'s margin review are still unassigned. <span style="color:var(--accent);font-weight:600;cursor:pointer">Assign now →</span>',
  },
];

export const liveRuns = [
  {
    id: 'run-fpa-may',
    name: 'FP&A Full Analysis · May data',
    eta: '~4 min left',
    percent: 62,
    stepDescription: 'Step 4 of 6 — building margin waterfall',
  },
  {
    id: 'run-cashflow-q3',
    name: 'Cash-flow Forecast · Q3',
    eta: '~2 min left',
    percent: 81,
    stepDescription: 'Step 5 of 6 — scenario synthesis',
  },
  {
    id: 'run-hr-eng',
    name: 'HR Screening · Eng cohort',
    eta: 'finishing',
    percent: 93,
    barColor: 'var(--teal)',
    stepDescription: 'Step 6 of 6 — ranking candidates',
  },
];

export const topPerformer = {
  id: 'sanju',
  name: 'Sanju Mathew',
  avatarBg: '#0D9488',
  initials: 'SJ',
  badge: '96% on-time',
  statLine: 'Closed 31 actions · paired with Profitability Agent · 11h saved',
};

export const runDetails = {
  'run-fpa-may': {
    id: 'run-fpa-may',
    name: 'FP&A Full Analysis — May 2026 actuals',
    meta: 'Margin Leakage Agent · started 14:02 by Sanju · est. finish 14:11 (9 min total)',
    isLive: true,
    steps: [
      { id: 's1', status: 'done', label: 'Ingest & validate data', description: '3 files · 41,209 rows · columns auto-detected (Budget, Actual, SKU, Region)', duration: '1m 12s' },
      { id: 's2', status: 'done', label: 'Variance analysis', description: 'Budget vs actuals across 6 regions · 14 variances above threshold', duration: '2m 04s' },
      { id: 's3', status: 'live', label: 'Margin waterfall', description: 'Decomposing gross-margin bridge by price, volume, mix, cost…', duration: 'running' },
      { id: 's4', status: 'gate', label: "Review gate — variance commentary", description: "Will pause for Praveen's approval before publishing", duration: 'waiting' },
      { id: 's5', status: 'wait', icon: '5', label: 'Publish outcome scorecard', description: 'Scorecard, narrative, recommended actions', duration: '—' },
    ],
  },
};

export const runs = [
  { id: 'run-cashflow-q3', name: 'Cash-flow Forecast · Q3', owner: { name: 'Ganesh', initials: 'GR', avatarBg: '#4F46E5' }, agentName: 'Forecast Agent', status: 'running', duration: '6m 12s', outcome: '—' },
  { id: 'run-hr-eng', name: 'HR Screening · Eng cohort', owner: { name: 'Devaki', initials: 'DH', avatarBg: '#0D9488' }, agentName: 'Screening Agent', status: 'running', duration: '8m 47s', outcome: '—' },
  { id: 'run-close-may', name: 'Month-end close · May', owner: { name: 'Praveen', initials: 'PJ', avatarBg: '#D97706' }, agentName: 'Close Agent', status: 'needs_decision', duration: 'paused 3h', outcome: '2 exceptions' },
  { id: 'run-profit-gcc', name: 'Profitability by customer · GCC', owner: { name: 'Sanju', initials: 'SJ', avatarBg: '#0D9488' }, agentName: 'Profitability Agent', status: 'completed', duration: '7m 31s', outcome: '+$84k found' },
  { id: 'run-anomaly-daily', name: 'Pricing anomaly scan · daily', owner: { name: 'Ganesh', initials: 'GR', avatarBg: '#4F46E5' }, agentName: 'Anomaly Agent', status: 'completed', duration: '3m 02s', outcome: '1 flag · SKU 4417' },
  { id: 'run-vendor-recon', name: 'Vendor reconciliation · weekly', owner: { name: 'Devaki', initials: 'DH', avatarBg: '#0D9488' }, agentName: 'Recon Agent', status: 'failed', duration: '0m 41s', outcome: 'source timeout · retried ✓' },
];

export const decisionStats = {
  trackedQtd: { value: 142, delta: { label: '▲ 38 vs last qtr', direction: 'up' } },
  winRate: { value: '78%', delta: { label: '▲ from 61%', direction: 'up' } },
  medianTimeToDecision: { value: '4.0h', delta: { label: 'was 2.1 days', direction: 'up' } },
  measuredImpactQtd: { value: '$1.2M', delta: { label: '31 decisions measured', direction: 'flat' } },
};

export const decisionLedger = [
  { id: 'led1', title: 'Reprice SKU 2210 family in UAE', subtitle: 'Margin leakage driver #1, May run', madeBy: { type: 'human', name: 'Praveen', initials: 'PJ', avatarBg: '#D97706' }, informedBy: { type: 'agent', name: 'Profitability Agent' }, date: '12 May', verdict: 'worked', measuredImpact: { text: '+$210k / qtr', direction: 'up' }, function: 'finance' },
  { id: 'led2', title: 'Consolidate 3 logistics vendors', subtitle: 'Cost optimization recommendation', madeBy: { type: 'human', name: 'Ganesh', initials: 'GR', avatarBg: '#4F46E5' }, informedBy: { type: 'agent', name: 'Cost Agent' }, date: '28 Apr', verdict: 'worked', measuredImpact: { text: '+$95k / qtr', direction: 'up' }, function: 'procurement' },
  { id: 'led3', title: 'Hold hiring for support roles', subtitle: 'Forecast showed demand dip', madeBy: { type: 'human', name: 'Devaki', initials: 'DH', avatarBg: '#0D9488' }, informedBy: { type: 'agent', name: 'Forecast Agent' }, date: '21 Apr', verdict: 'too_early', measuredImpact: { text: 'measuring…', direction: 'flat' }, function: 'hr' },
  { id: 'led4', title: 'Extend payment terms — distributor KSA', subtitle: 'Cash-flow scenario B', madeBy: { type: 'human', name: 'Praveen', initials: 'PJ', avatarBg: '#D97706' }, informedBy: { type: 'agent', name: 'Forecast Agent' }, date: '14 Apr', verdict: 'not_worked', measuredImpact: { text: '−$40k DSO cost', direction: 'down' }, function: 'finance' },
  { id: 'led5', title: 'Shift Q2 spend to performance channels', subtitle: 'Customer-mix insight, March run', madeBy: { type: 'human', name: 'Sanju', initials: 'SJ', avatarBg: '#0D9488' }, informedBy: { type: 'agent', name: 'Profitability Agent' }, date: '02 Apr', verdict: 'worked', measuredImpact: { text: '+18% ROAS', direction: 'up' }, function: 'finance' },
  { id: 'led6', title: 'Auto-approve invoices < $500', subtitle: 'Process decision · agent autonomous', madeBy: { type: 'agent', name: 'Close Agent' }, informedBy: { type: 'policy', name: 'policy' }, date: 'ongoing', verdict: 'worked', measuredImpact: { text: '22h / month saved', direction: 'up' }, function: 'finance' },
];

export const leaderboardHighlights = [
  { id: 'h1', medal: '🥇', tag: 'Most efficient · people', name: 'Sanju Mathew', avatarBg: '#0D9488', initials: 'SJ', statLine: '31 actions · 96% on-time · 11h saved' },
  { id: 'h2', medal: '🤖', tag: 'Top agent', name: 'Profitability Agent', avatarBg: '#4F46E5', initials: 'PA', statLine: '124 runs · 99.2% success · $389k impact' },
  { id: 'h3', medal: '⚡', tag: 'Best human + agent pair', name: 'Praveen + Close Agent', avatarBg: '#D97706', initials: 'PJ', statLine: 'Close time 9 days → 3 days' },
];

export const leaderboard = [
  { id: 'l1', type: 'human', name: 'Sanju Mathew', initials: 'SJ', avatarBg: '#0D9488', actionsClosed: 31, onTimePct: 96, decisionWinRatePct: 83, timeSaved: '11h', trend: [16, 13, 14, 9, 7, 3], trendColor: '#16A34A' },
  { id: 'l2', type: 'agent', name: 'Profitability Agent', initials: 'PA', avatarBg: '#4F46E5', actionsClosed: 124, onTimePct: 99.2, decisionWinRatePct: 81, timeSaved: '64h', trend: [14, 12, 10, 10, 6, 4], trendColor: '#16A34A' },
  { id: 'l3', type: 'human', name: 'Praveen Jagadeesan', initials: 'PJ', avatarBg: '#D97706', actionsClosed: 22, onTimePct: 91, decisionWinRatePct: 88, timeSaved: '—', trend: [15, 11, 12, 8, 8, 5], trendColor: '#16A34A' },
  { id: 'l4', type: 'human', name: 'Devaki Habib', initials: 'DH', avatarBg: '#0D9488', actionsClosed: 19, onTimePct: 87, decisionWinRatePct: 74, timeSaved: '6h', trend: [10, 12, 9, 11, 8, 7], trendColor: '#D97706' },
  { id: 'l5', type: 'agent', name: 'Forecast Agent', initials: 'FA', avatarBg: '#4F46E5', actionsClosed: 58, onTimePct: 98, decisionWinRatePct: 69, timeSaved: '29h', trend: [8, 10, 7, 9, 10, 8], trendColor: '#A8A29E' },
  { id: 'l6', type: 'human', name: 'Ganesh Rajasekaran', initials: 'GR', avatarBg: '#4F46E5', actionsClosed: 17, onTimePct: 84, decisionWinRatePct: 71, timeSaved: '4h', trend: [12, 10, 13, 10, 9, 9], trendColor: '#A8A29E' },
];

export const outcomeReports = {
  latest: {
    runId: 'latest',
    title: 'FP&A Outcome — May 2026',
    runMeta: 'Margin Leakage Agent · run completed in 8m 41s · approved by Praveen',
    published: true,
    scoreCards: [
      { id: 'sc1', label: 'Revenue', value: '$12.4M', deltaLabel: '▲ 6.2% vs budget', deltaTone: 'green', sparkline: [24, 21, 22, 16, 17, 12, 9, 5], sparklineColor: '#16A34A' },
      { id: 'sc2', label: 'Gross margin', value: '31.8%', deltaLabel: '▼ 1.4 pts vs budget', deltaTone: 'red', sparkline: [8, 10, 9, 13, 12, 17, 19, 22], sparklineColor: '#DC2626' },
      { id: 'sc3', label: 'Opex ratio', value: '18.2%', deltaLabel: '▲ on plan', deltaTone: 'green', sparkline: [15, 14, 16, 14, 15, 13, 14, 13], sparklineColor: '#16A34A' },
      { id: 'sc4', label: 'Cash conversion', value: '87 days', deltaLabel: '◷ watch', deltaTone: 'amber', sparkline: [18, 16, 17, 14, 16, 13, 15, 12], sparklineColor: '#D97706' },
    ],
    insights: [
      { id: 'i1', icon: '🎯', iconBg: 'var(--red-soft)', title: 'Margin leakage is concentrated, not systemic', text: '82% of the 1.4-pt margin miss comes from just two SKU families (2210, 4417) in UAE and KSA — price erosion, not cost inflation.' },
      { id: 'i2', icon: '📉', iconBg: 'var(--amber-soft)', title: 'Discounting is outpacing volume gains', text: 'Channel discounts rose 3.1 pts QoQ but drove only 0.8 pts of volume — negative price-volume trade in 4 of 6 regions.' },
      { id: 'i3', icon: '💡', iconBg: 'var(--green-soft)', title: 'Top-20 customers are healthier than the book', text: 'Contribution margin for the top 20 is up 2.2 pts; leakage sits in the long tail — a mix problem you can fix with floor pricing.' },
      { id: 'i4', icon: '🔁', iconBg: 'var(--teal-soft)', title: "Last quarter's repricing decision is confirmed", text: 'The SKU 2210 reprice (Decision Ledger, 12 May) is tracking +$210k/qtr — verdict updated to "Worked".' },
    ],
    actions: [
      { id: 'a1', title: 'Set floor pricing on SKU 4417 family — KSA', subtitle: 'Est. +$84k/qtr · owner suggested: Sanju', assigned: false, assignedTo: 'Sanju', actionType: 'assign' },
      { id: 'a2', title: 'Cap channel discounts at 12% for long tail', subtitle: 'Est. +0.6 pts margin · owner suggested: Praveen', assigned: false, assignedTo: 'Praveen', actionType: 'assign' },
      { id: 'a3', title: 'Re-run analysis with June market data', subtitle: 'Scheduled run · 1 July 09:00', assigned: false, actionType: 'schedule' },
    ],
  },
};

export function makeAgentBuilderSession() {
  return {
    detectedTemplate: 'FP&A template detected',
    messages: [
      {
        id: 'm1',
        role: 'user',
        text: 'I need an FP&A agent that analyses my P&L and tells me where margin is leaking — something my finance team can run themselves.',
      },
      {
        id: 'm2',
        role: 'bot',
        stepType: 'capabilities',
        stepLabel: 'Step 1 · Capabilities',
        text: "Good — that maps to our FP&A function pack. Which analyses should it run? I've pre-selected the usual four:",
        choices: [
          { id: 'c1', label: 'Variance analysis', selected: true },
          { id: 'c2', label: 'Margin waterfall', selected: true },
          { id: 'c3', label: 'Profitability by customer', selected: true },
          { id: 'c4', label: 'KPI scorecard', selected: true },
          { id: 'c5', label: 'Cash-flow forecast', selected: false },
          { id: 'c6', label: 'Anomaly detection', selected: false },
        ],
      },
      {
        id: 'm3',
        role: 'bot',
        stepType: 'data_context',
        stepLabel: 'Step 2 · Data context',
        text: 'What data will the team have when they run it? The agent adapts to whatever is ticked at run time.',
        choices: [
          { id: 'd1', label: 'P&L data', selected: true },
          { id: 'd2', label: 'Pricing data', selected: true },
          { id: 'd3', label: 'Customer mapping', selected: true },
          { id: 'd4', label: 'Market data', selected: false },
        ],
      },
      {
        id: 'm4',
        role: 'bot',
        stepType: 'plan',
        stepLabel: 'Step 3 · The plan',
        text: "Here's what I'll build. Everything below runs under the hood — your team only sees inputs and outcomes.",
        plan: {
          name: 'Margin Leakage Agent',
          estRuntime: '7–9 min',
          steps: [
            { n: 1, text: 'Ingest & validate P&L, pricing, customer files (auto-detect columns)' },
            { n: 2, text: 'Run variance + margin waterfall across products and regions' },
            { n: 3, text: 'Rank leakage drivers · flag anomalies above 2% threshold' },
            { n: 4, text: 'Review gate — a human approves before anything is shared' },
            { n: 5, text: 'Publish outcome scorecard + recommended actions' },
          ],
        },
      },
    ],
  };
}

export function makeDraftPreview() {
  return {
    state: 'draft',
    name: 'Margin Leakage Agent',
    function: 'FP&A · Finance',
    capabilitiesCount: 4,
    dataInputs: 'P&L · Pricing · Customers',
    reviewGate: 'Human approval · step 4',
    owner: { name: 'Praveen J.', initials: 'PJ', avatarBg: '#D97706' },
    guardrails: 'Finance pack · PII off',
    estRuntime: '7–9 min',
  };
}
