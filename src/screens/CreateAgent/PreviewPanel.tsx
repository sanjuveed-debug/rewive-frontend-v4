import { Avatar } from '../../components/shared/Avatar';
import { getCurrentUser } from '../../api/auth';
import type { CreatedAgent } from '../../api/agentBuilder';
import type { AgentDraft } from './index';

export function PreviewPanel({ draft, createdAgent }: { draft: AgentDraft; createdAgent: CreatedAgent | null }) {
  const isLive = !!createdAgent;
  const currentUser = getCurrentUser();

  const name = createdAgent?.name ?? draft.name ?? '—';
  const category = createdAgent?.category ?? draft.category;
  const toolCount = createdAgent?.tool_names?.length ?? draft.toolNames.length;
  const model = createdAgent?.model ?? draft.model;
  const maxTurns = createdAgent?.max_turns ?? draft.maxTurns;

  return (
    <div className="card preview">
      <div className="ph">
        ⚡ Agent preview
        <span className={`pill ${isLive ? 'green' : 'gray'}`} style={{ marginLeft: 'auto' }}>
          {isLive ? 'Live' : 'Draft'}
        </span>
      </div>
      <div className="pv-row"><span className="l">Name</span><span className="v">{name || '—'}</span></div>
      <div className="pv-row"><span className="l">Category</span><span className="v">{category.replace('_', ' ')}</span></div>
      <div className="pv-row"><span className="l">Tools</span><span className="v">{toolCount} selected</span></div>
      <div className="pv-row"><span className="l">Model</span><span className="v">{model}</span></div>
      <div className="pv-row"><span className="l">Max turns</span><span className="v">{maxTurns}</span></div>
      <div className="pv-row">
        <span className="l">Accountable owner</span>
        <span className="v">
          {currentUser ? (
            <span className="human">
              <Avatar initials={currentUser.name.slice(0, 2).toUpperCase()} background="var(--accent-soft)" size={20} fontSize={9} />
              {currentUser.name}
            </span>
          ) : (
            '—'
          )}
        </span>
      </div>
      <div className="pv-row">
        <span className="l">Focus area</span>
        <span className="v" style={{ maxWidth: 220, textAlign: 'right' }}>
          {(createdAgent?.focus_area ?? draft.focusArea) || '—'}
        </span>
      </div>
      <div className="pv-foot">
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          {isLive
            ? 'This agent is live and will show up in Agent Space. Every run is logged with its outcome, owner and impact.'
            : 'Fill in the form and create the agent — it goes live immediately on the real backend.'}
        </div>
      </div>
    </div>
  );
}
