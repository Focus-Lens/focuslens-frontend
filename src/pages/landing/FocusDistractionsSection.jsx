import focusIllustration from "../../assets/landing/block-distractions-illustration.png";
import "../../css/landing/LandingPage.css";

const benefits = [
  "Fewer distractions during study",
  "Learning checks that bring attention back",
  "Session controls in one place",
];

export default function FocusDistractionsSection() {
  return (
    <section className="focus-distractions" aria-labelledby="focus-distractions-title">
      <div className="focus-distractions-inner">
        <div className="focus-distractions-art">
          <img src={focusIllustration} alt="FocusLens study mode keeps distracting apps out of the way" />
        </div>
        <div className="focus-distractions-copy">
          <p className="focus-distractions-eyebrow">A SPACE FOR FOCUS</p>
          <h2 id="focus-distractions-title">Block distractions.<br />Keep the momentum.</h2>
          <p className="focus-distractions-description">
            Keep distracting apps out of the way during a FocusLens session. A<br className="focus-desktop-break" /> clear study view, session controls and learning checks help bring<br className="focus-desktop-break" /> attention back to the task.
          </p>
          <ul className="focus-distractions-list">
            {benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
