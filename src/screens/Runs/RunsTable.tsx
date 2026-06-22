import { Avatar } from '../../components/shared/Avatar';
import { Pill } from '../../components/shared/Pill';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';
import { useRuns } from '../../api/runs';
import type { RunListItem, RunStatus } from '../../api/types';

const statusPill: Record<RunStatus, { tone: 'indigo' | 'amber' | 'green' | 'red'; label: string }> = {
  running: { tone: 'indigo', label: 'Running' },
  needs_decision: { tone: 'amber', label: 'Needs decision' },
  completed: { tone: 'green', label: 'Completed' },
  failed: { tone: 'red', label: 'Failed' },
};

export function RunsTable({ status }: { status: RunStatus | 'all' }) {
  const { data, isLoading, isError } = useRuns(status);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table className="t">
        <thead>
          <tr>
            <th>Run</th><th>Owner</th><th>Agent</th><th>Status</th><th>Duration</th><th>Outcome</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={6}><Loading /></td></tr>
          )}
          {isError && (
            <tr><td colSpan={6}><ErrorMessage /></td></tr>
          )}
          {data?.map((run: RunListItem) => (
            <tr className="row-h" key={run.id}>
              <td><b>{run.name}</b></td>
              <td>
                {run.owner ? (
                  <span className="human">
                    <Avatar initials={run.owner.initials} background={run.owner.avatarBg} size={22} fontSize={9} />
                    {run.owner.name}
                  </span>
                ) : '—'}
              </td>
              <td><span className="agent-chip">{run.agentName}</span></td>
              <td><Pill tone={statusPill[run.status].tone}>{statusPill[run.status].label}</Pill></td>
              <td>{run.duration}</td>
              <td>{run.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
