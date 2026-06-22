import { usePulse } from '../../api/dashboard';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';

export function PulseList() {
  const { data, isLoading, isError } = usePulse();

  return (
    <div className="card">
      <div className="sec-head">
        <h3>Company pulse</h3>
        <span className="all">This week</span>
      </div>
      {isLoading && <Loading />}
      {isError && <ErrorMessage />}
      {data?.map((p) => (
        <div className="pulse-line" key={p.id}>
          <span className="pulse-dot" style={{ background: p.dotColor }}></span>
          <span dangerouslySetInnerHTML={{ __html: p.html }} />
        </div>
      ))}
    </div>
  );
}
