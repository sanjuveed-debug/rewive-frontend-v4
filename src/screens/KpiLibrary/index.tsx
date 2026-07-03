import { useState } from 'react';
import { SelectKpisTab } from './SelectKpisTab';
import { ImportPlanningTab } from './ImportPlanningTab';
import { TrackedKpisPanel } from './TrackedKpisPanel';

type Tab = 'select' | 'import';

export function KpiLibraryScreen() {
  const [tab, setTab] = useState<Tab>('select');

  return (
    <section className="screen" style={{ maxWidth: 1140 }}>
      <h1 className="page">KPI Library</h1>
      <div className="sub">
        The starting point when onboarding a new company: pick the KPIs that matter, or import them from a planning tool you already use — either way, we show exactly what data needs to be connected before signals can surface.
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'select' ? ' active' : ''}`} onClick={() => setTab('select')}>Select KPIs to track</button>
        <button className={`tab${tab === 'import' ? ' active' : ''}`} onClick={() => setTab('import')}>Import from Anaplan or similar</button>
      </div>

      {tab === 'select' && <SelectKpisTab />}
      {tab === 'import' && <ImportPlanningTab />}

      <div style={{ marginTop: 20 }}>
        <TrackedKpisPanel />
      </div>
    </section>
  );
}
