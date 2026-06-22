import type { OutcomeInsight } from '../../api/types';

export function InsightsList({ insights }: { insights: OutcomeInsight[] }) {
  return (
    <div className="card">
      <div className="sec-head">
        <h3>What the agent found</h3>
        <span className="pill indigo">narrative · confidence 91%</span>
      </div>
      {insights.map((i) => (
        <div className="insight" key={i.id}>
          <div className="ico" style={{ background: i.iconBg }}>{i.icon}</div>
          <div>
            <div className="t1">{i.title}</div>
            <div className="t2">{i.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
