import { Link } from 'react-router-dom';
import { Pill } from '../../components/shared/Pill';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';
import { useDashboardFindings } from '../../api/dashboard';
import { severityTone } from '../Findings/meta';
import type { Persona } from '../../api/types';

function hoursSince(dateStr: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 3_600_000));
}

// The disposition inbox: open findings, most recent first. The real backend has no
// persona-scoping concept (single-org), so this list is the same for every lens — see the
// `persona` prop kept only for call-site compatibility with the rest of Command Center.
export function FindingsList({ persona: _persona }: { persona: Persona | 'all' }) {
  const { data, isLoading, isError } = useDashboardFindings('open');

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="sec-head">
        <h3>Findings waiting on your disposition</h3>
        <Link className="all" to="/insights/findings">All findings →</Link>
      </div>
      {isLoading && <Loading />}
      {isError && <ErrorMessage />}
      {data?.length === 0 && <div className="state-msg">Nothing waiting on you — no open findings right now.</div>}
      {data?.slice(0, 3).map((f) => (
        <div className="dec-item" key={f.id}>
          <div className="dec-ico" style={{ background: 'var(--accent-soft)' }}>🕵️</div>
          <div style={{ minWidth: 0 }}>
            <div className="t1">
              <Link to={`/insights/findings/${f.id}`}>{f.title}</Link>{' '}
              <Pill tone={severityTone[f.severity]}>{f.severity}</Pill>
            </div>
            <div className="t2">{f.raisedByAgentName} · {f.summary}</div>
          </div>
          <div className="acts" style={{ alignItems: 'center' }}>
            <Pill tone="gray">open {hoursSince(f.detectedAt)}h</Pill>
            <Link className="btn primary sm" to={`/insights/findings/${f.id}`}>Disposition</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
