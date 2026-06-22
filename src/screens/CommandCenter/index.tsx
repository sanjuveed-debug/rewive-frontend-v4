import { useDashboardSummary } from '../../api/dashboard';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';
import { KpiRow } from './KpiRow';
import { DecisionsList } from './DecisionsList';
import { PulseList } from './PulseList';
import { LiveRunsList } from './LiveRunsList';
import { TopPerformerCard } from './TopPerformerCard';

export function CommandCenterScreen() {
  const { data: summary, isLoading, isError } = useDashboardSummary();

  return (
    <section className="screen">
      {isLoading && <Loading label="Loading dashboard…" />}
      {isError && <ErrorMessage message="Couldn't load dashboard summary." />}
      {summary && (
        <>
          <h1 className="page">Good morning, {summary.greetingName}</h1>
          <div className="sub" dangerouslySetInnerHTML={{ __html: summary.summarySentence }} />
          <KpiRow summary={summary} />
        </>
      )}

      <div className="grid home-cols">
        <div>
          <DecisionsList />
          <PulseList />
        </div>
        <div>
          <LiveRunsList />
          <TopPerformerCard />
        </div>
      </div>
    </section>
  );
}
