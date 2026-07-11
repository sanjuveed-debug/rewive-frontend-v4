import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../shared/Avatar';
import { usePendingDecisions } from '../../api/dashboard';
import { useWorkflows } from '../../api/agentStudio';
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

  if (!workflows?.length) return null;

  return (
    <div className="nav-sublist">
      {[...workflows].reverse().map((wf) => (
        <NavLink key={wf.id} to={`/build/studio/${wf.id}`} className={() => subClass({ isActive: wf.id === activeId })}>
          {wf.name || 'Untitled workflow'} {wf.status === 'draft' ? `· draft v${wf.version}` : '· published'}
        </NavLink>
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
      <div className="side-foot" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Sign out">
        <Avatar initials={user ? initialsFor(user.name) : 'U'} background="#4F46E5" />
        <div>
          <div className="who">{user?.name ?? 'Unknown user'}</div>
          <div className="role">{user?.role ?? ''}</div>
        </div>
      </div>
    </aside>
  );
}
