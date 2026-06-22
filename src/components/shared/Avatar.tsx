interface AvatarProps {
  initials: string;
  background: string;
  size?: number;
  fontSize?: number;
}

export function Avatar({ initials, background, size = 30, fontSize }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{
        background,
        width: size,
        height: size,
        fontSize: fontSize ?? Math.round(size * 0.38),
      }}
    >
      {initials}
    </div>
  );
}
