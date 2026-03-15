export default function AdminUserLoading() {
  return (
    <section className="grid-two loading-skeleton" aria-hidden="true">
      <div className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="card">
        <div className="skeleton-line title" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
      </div>
    </section>
  );
}
