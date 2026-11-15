export function Loading({ label = "Loading…" }) {
  return <div className="py-12 text-center text-sm text-muted">{label}</div>;
}

export function ErrorNotice({ message }) {
  return <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-brand">◌</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
