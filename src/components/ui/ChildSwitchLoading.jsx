import "../../css/dashboard/ChildSwitchLoading.css";

export default function ChildSwitchLoading({ title }) {
  return (
    <main className="child-switch-loading" aria-busy="true" aria-live="polite">
      <h1>{title}</h1>
      <section className="child-switch-loading-banner">
        <p>Updating the selected child’s information...</p>
        <small>Your current page and filters stay in place.</small>
      </section>
      <div className="child-switch-loading-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <section className="child-switch-loading-card" key={index}>
            <span className="child-switch-loading-line short" />
            <span className="child-switch-loading-line medium" />
            <span className="child-switch-loading-line long" />
          </section>
        ))}
      </div>
    </main>
  );
}
