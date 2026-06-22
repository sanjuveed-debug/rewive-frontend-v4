import { useLeaderboardHighlights } from '../../api/people';
import { Avatar } from '../../components/shared/Avatar';
import { Loading, ErrorMessage } from '../../components/shared/StateMessage';

export function HighlightCards() {
  const { data, isLoading, isError } = useLeaderboardHighlights();

  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage />;

  return (
    <div className="grid hl-cards">
      {data?.map((h) => (
        <div className="card hl" key={h.id}>
          <span className="medal">{h.medal}</span>
          <div className="tag">{h.tag}</div>
          <div className="big">
            <Avatar initials={h.initials} background={h.avatarBg} size={40} fontSize={14} />
            <div>
              <div className="nm">{h.name}</div>
              <div className="st">{h.statLine}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
