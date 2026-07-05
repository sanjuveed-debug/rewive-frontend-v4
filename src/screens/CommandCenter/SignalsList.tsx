import { Link, useNavigate } from 'react-router-dom';
import { Pill } from '../../components/shared/Pill';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';
import { useSuggestedSignals } from '../../api/signalStudio';
import { useCreateSolutionDesign } from '../../api/solutionDesign';
import { useToast } from '../../components/shared/Toast';
import type { Persona, SignalCategory } from '../../api/types';

const categoryTone: Record<SignalCategory, 'red' | 'amber' | 'indigo' | 'teal' | 'gray'> = {
  derailer: 'red',
  laggard: 'amber',
  cost_drainer: 'indigo',
  revenue_leakage: 'teal',
  other: 'gray',
};

export function SignalsList({ persona }: { persona: Persona | 'all' }) {
  const { data, isLoading, isError } = useSuggestedSignals(undefined, persona);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createSolution = useCreateSolutionDesign();

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="sec-head">
        <h3>Signals waiting on you</h3>
        <Link className="all" to="/insights/signals">Open Signal Studio →</Link>
      </div>
      {isLoading && <Loading />}
      {isError && <ErrorMessage />}
      {data?.length === 0 && <div className="state-msg">No signals for this lens right now.</div>}
      {data?.slice(0, 3).map((s) => (
        <div className="dec-item" key={s.id}>
          <div className="dec-ico" style={{ background: 'var(--accent-soft)' }}>📡</div>
          <div>
            <div className="t1">
              <Link to={`/insights/signals/${s.id}`}>{s.name}</Link>{' '}
              <Pill tone={categoryTone[s.category]}>{s.category.replace('_', ' ')}</Pill>
            </div>
            <div className="t2">{s.description}</div>
          </div>
          <div className="acts">
            <button
              className="btn primary sm"
              disabled={createSolution.isPending}
              onClick={() =>
                createSolution.mutate(s.id, {
                  onSuccess: (solution) => { showToast('Solution design started'); navigate(`/build/solutions/${solution.id}`); },
                })
              }
            >
              Solution design
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
