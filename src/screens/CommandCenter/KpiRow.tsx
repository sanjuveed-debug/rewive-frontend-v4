import type { DashboardSummary, Delta } from '../../api/types';

function DeltaText({ delta }: { delta: Delta }) {
  const arrow = delta.direction === 'up' ? '▲ ' : delta.direction === 'down' ? '▼ ' : '';
  return <div className={`k-delta ${delta.direction}`}>{arrow}{delta.label}</div>;
}

export function KpiRow({ summary }: { summary: DashboardSummary }) {
  const { kpis } = summary;
  return (
    <div className="grid kpis">
      <div className="card kpi">
        <div className="k-label">Actions executed today</div>
        <div className="k-val">{kpis.actionsExecutedToday.value}</div>
        <DeltaText delta={kpis.actionsExecutedToday.delta} />
      </div>
      <div className="card kpi">
        <div className="k-label">Decisions pending</div>
        <div className="k-val">{kpis.decisionsPending.value}</div>
        <DeltaText delta={kpis.decisionsPending.delta} />
      </div>
      <div className="card kpi">
        <div className="k-label">Agents active now</div>
        <div className="k-val">{kpis.agentsActiveNow.value}</div>
        <DeltaText delta={kpis.agentsActiveNow.delta} />
      </div>
      <div className="card kpi">
        <div className="k-label">Time saved this week</div>
        <div className="k-val">{kpis.timeSavedThisWeek.value}</div>
        <DeltaText delta={kpis.timeSavedThisWeek.delta} />
      </div>
      <div className="card kpi">
        <div className="k-label">On-time execution</div>
        <div className="k-val">{kpis.onTimeExecution.value}</div>
        <DeltaText delta={kpis.onTimeExecution.delta} />
      </div>
    </div>
  );
}
