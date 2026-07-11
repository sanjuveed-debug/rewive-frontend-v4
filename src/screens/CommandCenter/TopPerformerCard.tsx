import { useTopPerformer } from '../../api/dashboard';
import { Avatar } from '../../components/shared/Avatar';
import { Pill } from '../../components/shared/Pill';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';

export function TopPerformerCard() {
  const { data, isLoading, isError } = useTopPerformer('week');

  return (
    <div className="card">
      <div className="sec-head">
        <h3>Top performer this week</h3>
      </div>
      {isLoading && <Loading />}
      {isError && <ErrorMessage />}
      {!isLoading && !isError && !data && (
        <div className="state-msg">No completed tasks this week yet.</div>
      )}
      {data && (
        <div style={{ padding: '4px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={data.initials} background={data.avatarBg} size={42} fontSize={15} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>
              {data.name} <Pill tone="green" style={{ marginLeft: 6 }}>{data.badge}</Pill>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{data.statLine}</div>
          </div>
        </div>
      )}
    </div>
  );
}
