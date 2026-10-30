import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import brandMascot from "../../assets/logo.png";
import guideMascot from "../../assets/landing/getting-started-hero-mascot.png";
import laptopFrame from "../../assets/landing/parent-dashboard-laptop-frame.png";
import phoneFrame from "../../assets/landing/getting-started-phone-frame.png";
import profileSetupScreen from "../../assets/landing/getting-started-profile-setup-screen.png";
import studyDetailsScreen from "../../assets/landing/getting-started-study-details-screen.png";
import privateInvitationScreen from "../../assets/landing/getting-started-private-invitation-screen.png";
import studentAccountScreen from "../../assets/landing/getting-started-student-account-screen.png";
import connectAccountsScreen from "../../assets/landing/getting-started-connect-accounts-screen.png";
import firstSessionScreen from "../../assets/landing/getting-started-first-session-screen.png";
import studyAndCheckScreen from "../../assets/landing/getting-started-study-and-check-screen.png";
import reportsGoalsScreen from "../../assets/landing/getting-started-reports-and-goals-screen.png";
import LandingFinalCtaSection from "./LandingFinalCtaSection";
import LandingFooter from "./LandingFooter";
import "../../css/landing/LandingPage.css";

const guideSteps = [
  {
    title: "Profile setup",
    audience: "PARENT · DASHBOARD",
    heading: "Choose who sets up the profile.",
    description: "Sign in to your parent account, then choose how your child’s profile will be created.",
    points: [
      'Choose “I’ll set up my child’s profile” to enter their details yourself.',
      'Or choose “The child will set up their own profile” to send them a setup link.',
      "Select Continue to follow the route you chose.",
    ],
    note: "Both routes lead to a private invitation. Your child reviews the connection before it becomes active.",
    image: profileSetupScreen,
    imageAlt: "Parent profile setup choice screen",
  },
  {
    title: "Study details",
    audience: "PARENT · DASHBOARD",
    heading: "Add the study details, then review.",
    description: "Complete the profile in this order.",
    points: [
      "Basic information → add your child’s details.",
      "Studies → choose the grade and current subjects.",
      "Context → add optional study information.",
      "Goal → suggest a weekly study target.",
      "Review → check the profile before inviting.",
    ],
    note: "If your child is setting up their own profile, send the setup link instead of completing these details yourself.",
    image: studyDetailsScreen,
    imageAlt: "Parent study details screen",
  },
  {
    title: "Private invitation",
    audience: "PARENT · DASHBOARD",
    heading: "Send a private invitation.",
    description: "Choose one way to send the invitation to your child.",
    points: [
      "Send by email → enter your child’s email and select Send invitation.",
      "Copy invitation link → share the private link with your child.",
      "The dashboard shows the invitation as pending until your child joins.",
    ],
    note: "You won’t see study data before activation and sharing approval. Only your child should use their invitation.",
    image: privateInvitationScreen,
    imageAlt: "Parent private invitation screen",
  },
  {
    title: "Student account",
    audience: "STUDENT · MOBILE APP",
    heading: "Get started in the student app.",
    description: "On their phone, your child starts the FocusLens journey.",
    points: [
      "Choose Get Started and create an account, or sign in if they already have one.",
      "Verify the email address, then sign in.",
      "Complete the academic profile with the relevant grade and subjects.",
    ],
    note: "Keep access to the student’s email available for verification. A parent invitation and a student account are separate parts of setup.",
    image: studentAccountScreen,
    imageAlt: "Student account creation screen",
  },
  {
    title: "Connect accounts",
    audience: "STUDENT · MOBILE APP",
    heading: "Review the connection together.",
    description: "Your child checks who invited them and what the connection will share.",
    points: [
      "Open the parent connection request or the invitation your parent sent.",
      "Review the information listed on the connection screen.",
      "Choose Connect when ready to approve the relationship.",
    ],
    note: "Already using the app? Choose “Bring a parent along”, enter a parent’s email address or share an invitation link.",
    image: connectAccountsScreen,
    imageAlt: "Student reviewing a parent connection request",
  },
  {
    title: "First session",
    audience: "STUDENT · MOBILE APP",
    heading: "Prepare the first study session.",
    description: "Start a New Session, then choose the material and focus time.",
    points: [
      "Select the study mode, subject and session length.",
      "Add the study material. For a digital session, select a PDF.",
      "Choose the PDF pages, find sections and start the session.",
    ],
    note: "Use the PDF page numbers when selecting a range. Printed page numbers may be different.",
    image: firstSessionScreen,
    imageAlt: "Student preparing a first study session",
  },
  {
    title: "Study and check",
    audience: "STUDENT · MOBILE APP",
    heading: "Study, then check understanding.",
    description: "Work through the material and respond to the learning checks during the session.",
    points: [
      "Read the study content and keep the session controls close at hand.",
      "Answer the short questions and review the feedback.",
      "Continue studying, pause, or end the session when needed.",
    ],
    note: "Use the reading view or focus timer to follow the session. Learning checks keep attention on the study material.",
    image: studyAndCheckScreen,
    imageAlt: "Student studying and answering a learning check",
  },
  {
    title: "Reports and goals",
    audience: "PARENT · DASHBOARD",
    heading: "Return to the bigger picture.",
    description: "After setup and study, use the parent dashboard to follow the shared activity.",
    points: [
      "Open Reports to review session history and View details.",
      "Use the child selector when reviewing a connected child.",
      "Open Study Goals to suggest a weekly target for your child to review.",
    ],
    note: "Review the results together and use them to support the next study routine.",
    image: reportsGoalsScreen,
    imageAlt: "Parent dashboard reports and goals screen",
  },
];

export default function GettingStartedGuidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const animationRef = useRef(0);

  useEffect(() => {
    const closeMenu = (event) => {
      if (event.type === "keydown" && event.key === "Escape") setMenuOpen(false);
      if (event.type === "pointerdown") {
        const insideHeader = event.composedPath().some((node) => node instanceof Element && node.closest(".guide-header"));
        if (!insideHeader) setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", closeMenu);
    document.addEventListener("pointerdown", closeMenu);
    return () => {
      document.removeEventListener("keydown", closeMenu);
      document.removeEventListener("pointerdown", closeMenu);
    };
  }, []);

  function scrollToSteps(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById("guide-steps");
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", "#guide-steps");
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    const startY = window.scrollY;
    const headerHeight = document.querySelector(".guide-header")?.getBoundingClientRect().height || 0;
    const targetY = Math.max(0, startY + target.getBoundingClientRect().top - headerHeight);
    const distance = targetY - startY;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1050;
    const startedAt = performance.now();
    if (!duration || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY);
      animationRef.current = 0;
      return;
    }
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) animationRef.current = window.requestAnimationFrame(animate);
      else animationRef.current = 0;
    };
    animationRef.current = window.requestAnimationFrame(animate);
  }

  return (
    <main className="guide-page">
      <header className="guide-header">
        <Link className="guide-brand" to="/" aria-label="FocusLens home">
          <img src={brandMascot} alt="" />
          <span>FocusLens</span>
        </Link>
        <button className="guide-menu-toggle" type="button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="guide-navigation" onClick={() => setMenuOpen((open) => !open)}>
          <span /><span /><span />
        </button>
        <nav className={`guide-nav${menuOpen ? " is-open" : ""}`} id="guide-navigation" aria-label="Help navigation">
          <a href="#guide-steps" onClick={(event) => { setMenuOpen(false); scrollToSteps(event); }}>Help</a>
          <a className="guide-nav-button" href="#guide-steps" onClick={(event) => { setMenuOpen(false); scrollToSteps(event); }}>Start walkthrough</a>
          <Link className="guide-nav-button" to="/" onClick={() => setMenuOpen(false)}>Back to FocusLens</Link>
        </nav>
      </header>

      <section className="guide-hero">
        <div className="guide-hero-inner">
          <div className="guide-hero-copy">
            <p className="guide-eyebrow">FOCUSLENS HELP</p>
            <h1>Get started.<br />Get connected.</h1>
            <p className="guide-hero-description">Set up your child’s profile, send a private invitation, and guide them toward their first study session.</p>
            <div className="guide-hero-actions">
              <a className="guide-primary-button" href="#guide-steps" onClick={scrollToSteps}>Start the walkthrough</a>
              <a className="guide-secondary-button" href="https://drive.google.com/file/d/1eZACzuLn4kcdwIiAENCtuodBElsjxKjT/view" target="_blank" rel="noreferrer">Watch the video</a>
            </div>
          </div>
          <img className="guide-hero-mascot" src={guideMascot} alt="FocusLens mascot with an open book" />
        </div>
      </section>

      <section className="guide-before" id="before-you-begin">
        <div className="guide-section-inner">
          <h2>Before you begin</h2>
          <div className="guide-prep-grid">
            <article className="guide-prep-card">
              <h3>On your computer</h3>
              <p>Sign in to your parent account.<br />Have the child’s email address ready if you plan to send an email invitation.</p>
            </article>
            <article className="guide-prep-card">
              <h3>On your child’s phone</h3>
              <p>Have FocusLens and access to the student’s email ready for creation and verification.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="guide-steps-section" id="guide-steps">
        <div className="guide-section-inner">
          <h2>Follow along, step by step.</h2>
          <p className="guide-steps-intro">Choose a chapter or use Next step. The guide shows the sequence; your account details stay in the app.</p>
          <div className="guide-stepper">
            <aside className="guide-stepper-sidebar" aria-label="Guide chapters">
              <p>IN THIS GUIDE</p>
              {guideSteps.map((step, index) => (
                <button className={activeStep === index ? "is-active" : ""} key={step.title} type="button" aria-current={activeStep === index ? "step" : undefined} onClick={() => setActiveStep(index)}>
                  {step.title}
                </button>
              ))}
            </aside>
            <article className={`guide-step-content${guideSteps[activeStep].image ? " has-image" : ""}`} aria-live="polite" key={activeStep}>
              <header className="guide-step-heading">
                <p className="guide-step-audience">{guideSteps[activeStep].audience}</p>
                <h3>{guideSteps[activeStep].heading}</h3>
              </header>
              <div className="guide-step-copy">
                <p className="guide-step-description">{guideSteps[activeStep].description}</p>
                <ul>
                  {guideSteps[activeStep].points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                {guideSteps[activeStep].note && <p className="guide-step-note">{guideSteps[activeStep].note}</p>}

              </div>
              {guideSteps[activeStep].image && (activeStep === 3 || activeStep === 4 || activeStep === 5 || activeStep === 6 ? (
                <div className="guide-phone-stage">
                  <div className="guide-phone-screen-window">
                    <img className="guide-phone-screen" src={guideSteps[activeStep].image} alt={guideSteps[activeStep].imageAlt} />
                  </div>
                  <img className="guide-phone-frame" src={phoneFrame} alt="" />
                </div>
              ) : (
                <div className="guide-laptop-stage">
                  <div className="guide-laptop-screen-window">
                    <img className={`guide-laptop-screen${activeStep === 1 ? " study-details-screen" : ""}`} src={guideSteps[activeStep].image} alt={guideSteps[activeStep].imageAlt} />
                  </div>
                  <img className="guide-laptop-frame" src={laptopFrame} alt="" />
                </div>
              ))}
              <div className={`guide-step-controls${activeStep > 0 ? " has-previous" : ""}`}>
                {activeStep > 0 && <button className="guide-prev" type="button" onClick={() => setActiveStep((step) => Math.max(0, step - 1))}>Previous</button>}
                <button className="guide-next" type="button" onClick={() => setActiveStep((step) => step === guideSteps.length - 1 ? 0 : step + 1)}>{activeStep === guideSteps.length - 1 ? "Start again" : "Next step"}</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="guide-help-section" aria-labelledby="guide-help-title">
        <div className="guide-help-inner">
          <h2 id="guide-help-title">Need a hand?</h2>
          <div className="guide-help-grid">
            <article className="guide-help-card">
              <h3>I’d rather my child set up the profile.</h3>
              <p>Choose “The child will set up their own profile”, then send the private setup link.</p>
            </article>
            <article className="guide-help-card">
              <h3>The invitation is still pending.</h3>
              <p>Your child needs to activate it and approve sharing. Check the recipient email, then use Resend invitation if needed.</p>
            </article>
            <article className="guide-help-card">
              <h3>My child already has an account.</h3>
              <p>They can sign in and review the parent connection request. The student app also offers a way to invite a parent.</p>
            </article>
            <article className="guide-help-card">
              <h3>Why can’t I see study data yet?</h3>
              <p>Study data appears after activation and sharing approval. An invitation alone does not make the connection active.</p>
            </article>
          </div>
        </div>
      </section>
      <LandingFinalCtaSection />
      <LandingFooter />
    </main>
  );
}
