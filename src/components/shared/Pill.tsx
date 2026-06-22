import type { ReactNode } from 'react';

type PillTone = 'green' | 'amber' | 'red' | 'indigo' | 'teal' | 'gray';

export function Pill({ tone, children, style }: { tone: PillTone; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span className={`pill ${tone}`} style={style}>
      {children}
    </span>
  );
}
