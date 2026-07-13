import type { MouseEvent as ReactMouseEvent } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../shared/Avatar';
import { usePendingDecisions } from '../../api/dashboard';
import { useWorkflows, useDeleteWorkflow } from '../../api/agentStudio';
import { getArea, getAreaKeyFromPath } from './areas';
import { NavIcon } from './NavIcon';
import { getCurrentUser, clearSession } from '../../api/auth';

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? ' active' : ''}`;
const subClass = ({ isActive }: { isActive: boolean }) => `nav-subitem${isActive ? ' active' : ''}`;

function WorkflowSublist() {
  const { data: workflows } = useWorkflows();
  const { workflowId: activeId } = useParams();
  const navigate = useNavigate();
  const deleteWorkflow = useDeleteWorkflow();

  if (!workflows?.length) return null;

  const handleDelete = (e: ReactMouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this workflow? This cannot be undone.')) return;
    deleteWorkflow.mutate(id, {
      onSuccess: () => {
        if (activeId === id) navigate('/build/studio');
      },
    });
  };

  return (
    <div className="nav-sublist">
      {[...workflows].reverse().map((wf) => (
        <div key={wf.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink
            to={`/build/studio/${wf.id}`}
            className={() => subClass({ isActive: wf.id === activeId })}
            style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {wf.name || 'Untitled workflow'} {wf.status === 'draft' ? `· draft v${wf.version}` : '· published'}
          </NavLink>
          <button
            onClick={(e) => handleDelete(e, wf.id)}
            disabled={deleteWorkflow.isPending}
            title="Delete workflow"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-3)',
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function AreaSidebar() {
  const { pathname } = useLocation();
  const area = getArea(getAreaKeyFromPath(pathname));
  const { data: pendingDecisions } = usePendingDecisions();
  const pendingCount = pendingDecisions ? Math.min(pendingDecisions.length, 9) : undefined;
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="side area-side">
      <div className="nav-label">{area.label}</div>
      <nav className="nav">
        {area.items.map((item) => (
          <div key={item.to}>
            <NavLink to={item.to} className={navClass} end={item.end}>
              <NavIcon icon={item.icon} />
              {item.label}
              {item.badgeKey === 'pendingDecisions' && !!pendingCount && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </NavLink>
            {item.to === '/build/studio' && <WorkflowSublist />}
          </div>
        ))}
      </nav>
      <div className="side-foot" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar initials={user ? initialsFor(user.name) : 'U'} background="#4F46E5" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="who" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? 'Unknown user'}</div>
          <div className="role">{user?.role ?? ''}</div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            flexShrink: 0,
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--ink-2)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
