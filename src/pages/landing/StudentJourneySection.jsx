import { useEffect, useRef, useState } from "react";
import phoneFrame from "../../assets/landing/landing-phone-frame-cropped.png";
import readyScreen from "../../assets/landing/figma-screens/student-app-ready.png";
import studyScreen from "../../assets/landing/figma-screens/student-app-study.png";
import checkScreen from "../../assets/landing/figma-screens/student-app-check.png";
import reflectScreen from "../../assets/landing/figma-screens/student-app-reflect.png";

const steps = [
  { eyebrow: "GET READY", title: "Choose your session.", description: "Subject, study mode and time come together before you start." },
  { eyebrow: "STUDY", title: "Study your way.", description: "Read the material in a clear view, with session controls close at hand." },
  { eyebrow: "CHECK", title: "Check your understanding.", description: "Short learning checks bring attention back to the material you are studying." },
  { eyebrow: "REFLECT", title: "See what you achieved.", description: "Review the session summary, its highlights and the details of your study." },
];
const screens = [readyScreen, studyScreen, checkScreen, reflectScreen];
const screenAlts = ["Ready to focus screen", "Study session screen", "Learning check screen", "Session details screen"];

export default function StudentJourneySection() {
  const sectionRef = useRef(null);
  const copyRefs = useRef([]);
  const [progress, setProgress] = useState(0);
  const activeStep = progress < 0.273 ? 0 : progress < 0.547 ? 1 : progress < 0.82 ? 2 : 3;
  const trackTransform = `translateY(${Math.min(progress / 0.82, 1) * -80.315}%)`;



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

  return <section className="landing-story student-journey" id="student-app" aria-labelledby="student-journey-title">
    <div className="landing-story-intro student-journey-intro">
      <p className="landing-story-eyebrow">INSIDE THE STUDENT APP</p>
      <h2 id="student-journey-title">Follow a study journey.</h2>
      <p className="student-journey-subtitle">From choosing what to study to understanding what happened.</p>
    </div>
    <div className="landing-story-scroll student-journey-scroll" ref={sectionRef}>
      <div className="landing-story-sticky" style={{ "--story-progress": progress }}>
        <div className="landing-story-copy-window" aria-live="polite">
          <div className="landing-story-copy-track student-journey-copy-track" style={{ transform: trackTransform }}>
            {steps.map((step, index) => <div className="student-copy-group" style={{ display: "contents" }} key={step.eyebrow}>
              <div className={`landing-story-copy landing-story-copy--${index}`} aria-hidden={index !== activeStep}>
                <p className="landing-story-eyebrow">{step.eyebrow}</p>
                <h3>{step.title}</h3>
                <p className="landing-story-description">{step.description}</p>
                <span className="landing-story-scroll-hint">Scroll to continue ↓</span>
              </div>
              {index < steps.length - 1 && <div className="student-copy-gap" aria-hidden="true" />}
            </div>)}
          </div>
        </div>
        <div className="landing-story-phone" aria-label="FocusLens student app preview">
          <div className="landing-story-screen-window student-journey-screen-window">
            <div className="landing-story-screen-track student-journey-screen-track" style={{ transform: trackTransform }}>
              {screens.map((screen, index) => <div className="student-screen-group" style={{ display: "contents" }} key={screen}>
                <img className="story-phone-screen" src={screen} alt={screenAlts[index]} />
                {index < screens.length - 1 && <div className="student-screen-gap" aria-hidden="true" />}
              </div>)}
            </div>
          </div>
          <img className="landing-story-phone-frame" src={phoneFrame} alt="" />
        </div>
      </div>
    </div>
  </section>;
}
