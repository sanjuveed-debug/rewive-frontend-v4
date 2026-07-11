import { useRunDetail } from '../../api/runs';
import { Pill } from '../../components/shared/Pill';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';

const dotIcon: Record<string, string> = { done: '✓', live: '●', wait: '', gate: '⏸' };

export function LiveRunCard({ runId }: { runId: string }) {
  const { data, isLoading, isError } = useRunDetail(runId);

  if (isLoading) return <div className="card run-x"><Loading /></div>;
  if (isError || !data) return <div className="card run-x"><ErrorMessage /></div>;

  return (
    <div className="card run-x">
      <div className="rx-head">
        <Pill tone="indigo">● LIVE</Pill>
        <div>
          <div className="nm">{data.name}</div>
          <div className="meta">{data.meta}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn ghost sm">Watch</button>
          <button
            className="btn ghost sm"
            disabled
            title="Pausing runs is not supported by the backend yet"
          >
            Pause
          </button>
        </div>
      </div>
      <div className="timeline">
        {data.steps.map((step) => (
          <div className="tl-step" key={step.id}>
            <div className={`tl-dot ${step.status}`}>
              {step.status === 'wait' ? step.icon ?? '' : dotIcon[step.status]}
            </div>
            <div>
              <div className="s1">{step.label}</div>
              <div className="s2">{step.description}</div>
            </div>
            <div className="dur">{step.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
