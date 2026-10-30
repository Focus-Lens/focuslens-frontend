import { useEffect, useRef, useState } from "react";
import phoneFrame from "../../assets/landing/landing-phone-frame-cropped.png";
import connectionScreen from "../../assets/landing/figma-screens/how-it-works-connection.png";
import planScreen from "../../assets/landing/figma-screens/how-it-works-plan.png";
import sessionScreen from "../../assets/landing/figma-screens/how-it-works-session.png";

const screens = [connectionScreen, planScreen, sessionScreen];

const steps = [
  { eyebrow: "CONNECT AS A FAMILY", title: "Start with a connection.", description: "Create your parent account, then invite your child. They review what will be shared and approve the connection." },
  { eyebrow: "MAKE A PLAN", title: "Make room for study.", description: "Choose a subject, study mode and session length. Bring the material they want to work through." },
  { eyebrow: "START A ROUTINE", title: "Take the next focused step.", description: "A clear reading view and session controls help make the first study session approachable." },
];

export default function GettingStartedSection() {
  const sectionRef = useRef(null);
  const copyRefs = useRef([]);
  const [progress, setProgress] = useState(0);
  const activeStep = progress < 0.4 ? 0 : progress < 0.79 ? 1 : 2;




  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
        setProgress(Math.min(1, Math.max(0, -rect.top / scrollable)));
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return <section className="landing-story" id="how-it-works" aria-labelledby="story-title">
    <div className="landing-story-intro">
      <p className="landing-story-eyebrow">FROM YOUR ACCOUNT TO THEIR FIRST SESSION</p>
      <h2 id="story-title">Start together,<br /><span>one step at a time.</span></h2>
    </div>
    <div className="landing-story-scroll" ref={sectionRef}>
      <div className="landing-story-sticky" style={{ "--story-progress": progress }}>
        <div className="landing-story-copy-window" aria-live="polite">
          <div className="landing-story-copy-track" style={{ transform: `translateY(${Math.min(progress / 0.8, 1) * -73.1}%)` }}>
            {steps.map((step, index) => <div className="landing-story-copy-group" style={{ display: "contents" }} key={step.eyebrow}>
              <div className={`landing-story-copy landing-story-copy--${index}`} aria-hidden={index !== activeStep}>
                <p className="landing-story-eyebrow">{step.eyebrow}</p>
                <h3>{step.title}</h3>
                <p className="landing-story-description">{step.description}</p>
                <span className="landing-story-scroll-hint">Scroll to continue ↓</span>
              </div>
              {index < 2 && <div className="landing-story-copy-gap" aria-hidden="true" />}
            </div>)}
          </div>
        </div>        <div className="landing-story-phone" aria-label="FocusLens app preview">
          <div className="landing-story-screen-window">
            <div className="landing-story-screen-track" style={{ transform: `translateY(${Math.min(progress / 0.8, 1) * -73.1}%)` }}>
              <img className="story-phone-screen" src={screens[0]} alt="Review connection screen" />
              <div className="story-screen-gap" aria-hidden="true" />
              <img className="story-phone-screen" src={screens[1]} alt="Ready to focus screen" />
              <div className="story-screen-gap" aria-hidden="true" />
              <img className="story-phone-screen" src={screens[2]} alt="Study session screen" />
            </div>
          </div>
          <img className="landing-story-phone-frame" src={phoneFrame} alt="" />
        </div>
      </div>
    </div>
  </section>;
}








