import { useLocation, useNavigate } from 'react-router-dom';

const titles: Record<string, string> = {
  '/': 'Command Center',
  '/create': 'Create an Agent',
  '/runs': 'Runs & Actions',
  '/decisions': 'Decision Ledger',
  '/people': 'People & Agents',
};

function titleFor(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith('/outcomes')) return 'Outcomes';
  return 'Rewive';
}

export function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="crumb">{titleFor(pathname)}</div>
      <div className="cmdbar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        Ask Rewive to do something… <span className="kbd">⌘K</span>
      </div>
      <div className="top-actions">
        <div className="bell">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          <span className="dot"></span>
        </div>
        <button className="btn primary sm" onClick={() => navigate('/create')}>
          + New Agent
        </button>
      </div>
    </div>
  );
}
