import "../../css/dashboard/ChildSwitchError.css";

const sectionNames = {
  Overview: "overview",
  Reports: "reports",
  Progress: "progress",
  "Study Goals": "study goals",
  Children: "profile",
};

export default function ChildSwitchError({ title, onRetry }) {
  const section = sectionNames[title] || title.toLowerCase();

  return (
    <main className="child-switch-error" role="alert" aria-live="polite">
      <h1>{title}</h1>
      <section className="child-switch-error-card">
        <h2>We couldn’t load this child’s {section}</h2>
        <p>
          Try again, or choose another child from the menu. The previous child’s
          data stays hidden.
        </p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </section>
    </main>
  );
}

export function ChildNoData({ title, heading, description }) {
  function chooseAnotherChild() {
    window.dispatchEvent(new Event("focuslens:open-child-picker"));
  }

  return (
    <main className="child-no-data">
      <h1>{title}</h1>
      <section className="child-no-data-card">
        <h2>{heading}</h2>
        <p>{description}</p>
        <button type="button" onClick={chooseAnotherChild}>
          Choose another child
        </button>
      </section>
    </main>
  );
}
