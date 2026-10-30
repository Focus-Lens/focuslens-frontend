import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import phoneScreen from "../../assets/landing/footer-phone-screen.png";
import phoneFrame from "../../assets/landing/landing-phone-frame-cropped.png";
import mascot from "../../assets/landing/hero-mascot.png";

export default function LandingFinalCtaSection() {
  return (
    <section className="landing-final-cta-wrap" aria-labelledby="landing-final-cta-title">
      <div className="landing-final-cta">
        <div className="landing-final-cta-copy">
          <p className="landing-final-cta-eyebrow">YOUR NEXT STEP</p>
          <h2 id="landing-final-cta-title"><span>Take the first</span><span>step together.</span></h2>
          <p className="landing-final-cta-description">Create your parent account, then invite your child to begin.</p>
          <div className="landing-final-cta-actions">
            <Link className="landing-final-cta-button" to="/register">Create parent account</Link>
            <a className="landing-final-cta-student" href="https://tally.so/r/yXXaV0">Student? Explore the app <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="landing-final-cta-art" aria-label="FocusLens app and mascot">
          <div className="landing-final-cta-phone">
            <div className="landing-final-cta-screen"><img src={phoneScreen} alt="FocusLens student app home screen" /></div>
            <img className="landing-final-cta-phone-frame" src={phoneFrame} alt="" />
          </div>
          <img className="landing-final-cta-mascot" src={mascot} alt="FocusLens mascot reading a book" />
        </div>
      </div>
    </section>
  );
}

