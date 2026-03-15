export default function DashboardLoading() {
  return (
    <section className="grid-two" aria-hidden="true">
      {[1, 2].map((i) => (
        <div key={i} className="card loading-skeleton">
          <div className="skeleton-line title" />
          <div className="skeleton-line amount" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </section>
  );
}
