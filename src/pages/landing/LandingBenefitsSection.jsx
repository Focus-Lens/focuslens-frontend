import { useState } from "react";
import paperMascot from "../../assets/landing/blue-section/mascot-paper-study.png";
import digitalMascot from "../../assets/landing/blue-section/mascot-digital-study.png";
import celebrateMascot from "../../assets/landing/blue-section/mascot-celebrate.png";
import planningIcon from "../../assets/landing/blue-section/icon-session-planning.png";
import modesIcon from "../../assets/landing/blue-section/icon-study-modes.png";
import checksIcon from "../../assets/landing/blue-section/icon-learning-checks.png";
import summariesIcon from "../../assets/landing/blue-section/icon-session-summaries.png";
import connectionIcon from "../../assets/landing/blue-section/icon-parent-connection.png";
import achievementsIcon from "../../assets/landing/blue-section/icon-missions-achievements.png";
import "../../css/landing/LandingPage.css";

const illustratedFeatures = [
  { image: paperMascot, title: "Paper study", description: <>Keep a real book open while<br />FocusLens guides the session.</> },
  { image: digitalMascot, title: "Digital study", description: <>Read your study content in a clear view<br />with session controls.</> },
  { image: celebrateMascot, title: "Celebrate the effort", description: <>Missions, achievements and levels make<br />consistent study visible.</> },
];

const featureCards = [
  { image: planningIcon, title: "Session planning", description: "Choose a subject, study mode and session length before you begin." },
  { image: modesIcon, title: "Paper & digital modes", description: "Build a study routine around a printed book or digital content." },
  { image: checksIcon, title: "Learning checks", description: "Answer short questions based on the material in the study session." },
  { image: summariesIcon, title: "Session summaries", description: "Review the session, its highlights and the details of your study." },
  { image: connectionIcon, title: <>A student-approved<br />connection</>, description: "Students review what is shared before connecting with a parent." },
  { image: achievementsIcon, title: <>Missions &<br />achievements</>, description: "See steady effort through missions, points and the level path." },
];

export default function LandingBenefitsSection() {
  const [selectedCard, setSelectedCard] = useState(0);

  return (
    <section className="landing-benefits" id="features" aria-labelledby="benefits-title">
      <div className="landing-benefits-inner">
        <header className="landing-benefits-header">
          <p className="landing-benefits-eyebrow">MADE FOR THEIR STUDY ROUTINE</p>
          <h2 id="benefits-title">Different ways to study.<br />One companion along the way.</h2>
          <p className="landing-benefits-lead">From a first study session to a clearer picture of progress,<br />FocusLens brings the steps together.</p>
        </header>

        <div className="landing-benefits-illustrations">
          {illustratedFeatures.map((feature) => (
            <article className="landing-benefit-illustration" key={feature.title}>
              <img src={feature.image} alt="" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <h3 className="landing-benefits-subheading">Thoughtful features, from start to summary.</h3>
        <div className="landing-benefits-grid">
          {featureCards.map((feature, index) => (
            <button
              className={`landing-benefit-card${selectedCard === index ? " is-selected" : ""}`}
              type="button"
              aria-pressed={selectedCard === index}
              onClick={() => setSelectedCard(index)}
              key={index}
            >
              <img className="landing-benefit-icon" src={feature.image} alt="" />
              <span className="landing-benefit-title">{feature.title}</span>
              <span className="landing-benefit-description">{feature.description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
