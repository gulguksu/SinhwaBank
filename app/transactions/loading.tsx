export default function TransactionsLoading() {
  return (
    <section className="card loading-skeleton" aria-hidden="true">
      <div className="skeleton-line title" />
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
    </section>
  );
}
