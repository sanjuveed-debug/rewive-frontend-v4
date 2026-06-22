export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="state-msg">{label}</div>;
}

export function ErrorMessage({ message = 'Something went wrong. Please try again.' }: { message?: string }) {
  return <div className="state-msg error">{message}</div>;
}
