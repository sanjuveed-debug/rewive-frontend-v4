import { useState } from 'react';
import { Pill } from '../../components/shared/Pill';
import { useRuns } from '../../api/runs';
import { useRunChases, useFlagRunFeedback } from '../../api/runs';
import { useToast } from '../../components/shared/Toast';

// The real backend has no SLA chase/escalation tracking — useRunChases honestly resolves to
// an empty array, and flagging feedback has nowhere to go, so the form below is disabled with
// an explanatory tooltip rather than pretending to succeed.
export function ChaseEscalateList() {
  const { data: chases } = useRunChases();
  const { data: runList } = useRuns();
  const flagFeedback = useFlagRunFeedback();
  const { showToast } = useToast();
  const [runId, setRunId] = useState('');
  const [text, setText] = useState('');

  return (
    <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Chase and escalate</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 10 }}>Stalled steps get chased automatically; you can also flag feedback that routes straight to the agent owner.</div>

      {chases?.length === 0 && <div className="state-msg">No chases or escalations tracked — the backend doesn't support this yet.</div>}

      {chases?.map((c) => (
        <div key={c.id} style={{ padding: '9px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Pill tone={c.trigger === 'sla' ? 'amber' : 'indigo'}>{c.trigger === 'sla' ? 'no response' : 'from feedback'}</Pill>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{c.runName}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>{c.note}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Escalated to {c.escalatedTo}</div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, borderTop: chases?.length ? '1px solid var(--border)' : 'none', paddingTop: chases?.length ? 12 : 0 }}>
        <select value={runId} onChange={(e) => setRunId(e.target.value)} style={{ border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}>
          <option value="">Flag a run…</option>
          {runList?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <input
          placeholder="What's wrong, e.g. too noisy, wrong threshold…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1, border: '1px solid var(--border-strong)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
        />
        <button
          className="btn ghost sm"
          disabled
          title="Flagging feedback is not supported by the backend yet"
          onClick={() =>
            flagFeedback.mutate(
              { runId, text },
              {
                onSuccess: () => { showToast('Escalated to the agent owner'); setText(''); },
                onError: () => showToast("Flagging feedback isn't supported by the backend yet"),
              }
            )
          }
        >
          Flag &amp; escalate
        </button>
      </div>
    </div>
  );
}
