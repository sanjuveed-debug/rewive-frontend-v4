import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmitWorkbench, useWorkbenchStatus } from '../../../api/workbench';
import { useToast } from '../../../components/shared/Toast';
import { Pill } from '../../../components/shared/Pill';

export function RunAgentPanel({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [objective, setObjective] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [taskId, setTaskId] = useState<string | undefined>(undefined);
  const submit = useSubmitWorkbench();
  const status = useWorkbenchStatus(taskId);
  const { showToast } = useToast();

  const handleRun = () => {
    if (!objective.trim()) return;
    submit.mutate(
      { name: `${agentName} — ad hoc run`, objective: objective.trim(), agentIds: [agentId], year },
      {
        onSuccess: (res) => setTaskId(res.task_id),
        onError: () => showToast('Could not start the run'),
      }
    );
  };

  const output = status.data?.result?.agent_outputs?.[0];
  const isRunning = taskId && status.data?.status === 'running';
  const isComplete = status.data?.status === 'complete';
  const isFailed = status.data?.status === 'error' || (isComplete && output?.output?.startsWith('Agent error'));

  return (
    <div className="card" style={{ maxWidth: 520, marginTop: 16, position: 'relative' }}>
      <div className="ph">▶ Run this agent</div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
          Kicks off a real analysis against your live financial data — the same pipeline behind every saved report.
        </div>
        <textarea
          placeholder="What should this agent analyze? e.g. 'Flag any concerning margin trends for 2025 and recommend actions'"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          disabled={!!taskId}
          rows={3}
          style={{
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--ink-2)' }}>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={!!taskId}
            style={{ width: 90, border: '1px solid var(--border-strong)', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}
          />
        </div>

        {!taskId ? (
          <button className="btn primary" disabled={!objective.trim() || submit.isPending} onClick={handleRun}>
            {submit.isPending ? 'Starting…' : 'Run now'}
          </button>
        ) : (
          <div style={{ marginTop: 6 }}>
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Pill tone="amber">Running…</Pill>
                <span style={{ color: 'var(--ink-2)' }}>Claude is analyzing your real data — this usually takes 30–90 seconds.</span>
              </div>
            )}
            {isFailed && (
              <div>
                <Pill tone="red">Failed</Pill>
                <div style={{ fontSize: 12.5, color: 'var(--red)', marginTop: 8 }}>
                  {status.data?.error ?? output?.output ?? 'The run failed.'}
                </div>
                <button
                  className="btn ghost sm"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setTaskId(undefined);
                  }}
                >
                  Try again
                </button>
              </div>
            )}
            {isComplete && !isFailed && output && (
              <div>
                <Pill tone="green">Complete</Pill>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', margin: '8px 0' }}>
                  {output.tokens_used.toLocaleString()} tokens · real Claude analysis saved to your reports
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    maxHeight: 200,
                    overflowY: 'auto',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {output.output.slice(0, 800)}
                  {output.output.length > 800 ? '…' : ''}
                </div>
                {status.data?.result?.report_id && (
                  <Link
                    className="btn ghost sm"
                    style={{ marginTop: 10 }}
                    to={`/insights/outcomes/${status.data.result.report_id}`}
                  >
                    View full report →
                  </Link>
                )}
                <button
                  className="btn ghost sm"
                  style={{ marginTop: 10, marginLeft: 8 }}
                  onClick={() => {
                    setTaskId(undefined);
                    setObjective('');
                  }}
                >
                  Run again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
