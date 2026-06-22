import { NavLink } from 'react-router-dom';
import { Avatar } from '../shared/Avatar';
import { usePendingDecisions } from '../../api/dashboard';

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? ' active' : ''}`;

export function Sidebar() {
  const { data: pendingDecisions } = usePendingDecisions();
  const runsBadge = pendingDecisions ? Math.min(pendingDecisions.length, 9) : undefined;

  return (
    <aside className="side">
      <div className="logo">
        <div className="logo-mark">R</div>
        <div>
          <div className="logo-name">Rewive</div>
          <div className="logo-tag">Accountability Layer</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-label">Operate</div>
        <NavLink to="/" className={navClass} end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10h14V10" />
          </svg>
          Command Center
        </NavLink>
        <NavLink to="/runs" className={navClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          Runs &amp; Actions
          {!!runsBadge && <span className="nav-badge">{runsBadge}</span>}
        </NavLink>
        <NavLink to="/decisions" className={navClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          Decision Ledger
        </NavLink>
        <div className="nav-label">Build</div>
        <NavLink to="/create" className={navClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create an Agent
        </NavLink>
        <NavLink to="/people" className={navClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
            <circle cx="17.5" cy="9" r="2.5" />
            <path d="M16 15.2c2.6.3 4.6 1.9 5.5 4.8" />
          </svg>
          People &amp; Agents
        </NavLink>
        <div className="nav-label">Understand</div>
        <NavLink to="/outcomes" className={navClass}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="M8 15l3-4 3 2 4-6" />
          </svg>
          Outcomes
        </NavLink>
      </nav>
      <div className="side-foot">
        <Avatar initials="KV" background="#4F46E5" />
        <div>
          <div className="who">Kumara Vijayan</div>
          <div className="role">Co-founder · Admin</div>
        </div>
      </div>
    </aside>
  );
}
