import type { SimulationResult } from '../../api/types';
import { Pill } from '../../components/shared/Pill';

const STATUS_TONE: Record<SimulationResult['status'], 'green' | 'amber' | 'red'> = {
  success: 'green',
  partial: 'amber',
  failed: 'red',
};

const STATUS_LABEL: Record<SimulationResult['status'], string> = {
  success: 'Success',
  partial: 'Structural check only',
  failed: 'Failed',
};

export function SimulationPanel({ result, onClose }: { result: SimulationResult; onClose: () => void }) {
  return (
    <div className="simulation-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Simulation result</div>
          <Pill tone={STATUS_TONE[result.status]}>{STATUS_LABEL[result.status]}</Pill>
        </div>
        <button className="btn ghost sm" onClick={onClose}>Close</button>
      </div>
      {result.budgetWarning && (
        <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 8 }}>⚠ {result.budgetWarning}</div>
      )}
      {result.nodeResults.map((r) => (
        <div className="sim-node-result" key={r.nodeId}>{r.summary}</div>
      ))}
      {result.finalOutputPreview && (
        <div className="sim-final" style={result.status === 'partial' ? { color: 'var(--muted, #8a8f98)', fontStyle: 'italic' } : undefined}>
          {result.finalOutputPreview}
        </div>
      )}
    </div>
  );
}
