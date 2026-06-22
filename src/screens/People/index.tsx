import { HighlightCards } from './HighlightCards';
import { LeaderboardTable } from './LeaderboardTable';

export function PeopleScreen() {
  return (
    <section className="screen">
      <h1 className="page">People &amp; Agents</h1>
      <div className="sub">Who and what is actually moving the company — humans and agents measured on the same scoreboard.</div>

      <HighlightCards />
      <LeaderboardTable />

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)' }}>
        Scores measure execution, not surveillance: actions closed, timeliness, and whether the decisions a person sponsored actually worked. Agents and people are held to the same standard.
      </div>
    </section>
  );
}
