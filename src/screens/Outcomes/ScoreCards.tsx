import { Pill } from '../../components/shared/Pill';
import type { ScoreCard } from '../../api/types';

export function ScoreCards({ cards }: { cards: ScoreCard[] }) {
  return (
    <div className="grid score">
      {cards.map((sc) => (
        <div className="card sc" key={sc.id}>
          <div className="l">{sc.label}</div>
          <div className="v">{sc.value}</div>
          <Pill tone={sc.deltaTone}>{sc.deltaLabel}</Pill>
          <div style={{ marginTop: 10 }}>
            <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none">
              <polyline
                points={sc.sparkline
                  .map((v, i) => `${(i * (200 / (sc.sparkline.length - 1 || 1))).toFixed(1)},${v.toFixed(1)}`)
                  .join(' ')}
                fill="none"
                stroke={sc.sparklineColor}
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
