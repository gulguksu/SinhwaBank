export default function ShopLoading() {
  return (
    <section className="card loading-skeleton">
      <div className="skeleton-line title" />
      <div className="skeleton-line amount" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </section>
  );
}
