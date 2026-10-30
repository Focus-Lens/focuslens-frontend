
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GettingStartedSection from "./GettingStartedSection";
import StudentJourneySection from "./StudentJourneySection";
import FocusDistractionsSection from "./FocusDistractionsSection";
import ParentConversationSection from "./ParentConversationSection";
import ReasonsToReturnSection from "./ReasonsToReturnSection";
import LandingPricingSection from "./LandingPricingSection";
import LandingFaqSection from "./LandingFaqSection";
import LandingFinalCtaSection from "./LandingFinalCtaSection";
import LandingFooter from "./LandingFooter";
import LandingBenefitsSection from "./LandingBenefitsSection";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import brandMascot from "../../assets/logo.png";
import mascotNeutral from "../../assets/mascot/mascot-neutral.png";
import mascotLeft from "../../assets/mascot/mascot-left.png";
import mascotRight from "../../assets/mascot/mascot-right.png";
import mascotUp from "../../assets/mascot/mascot-up.png";
import mascotDown from "../../assets/mascot/mascot-down.png";
import topWave from "../../assets/landing/landing-wave-top.svg";
import middleWave from "../../assets/landing/landing-wave-middle.svg";
import bottomWave from "../../assets/landing/landing-wave-bottom.svg";
import "../../css/landing/LandingPage.css";

const mascotPoses = [
  ["neutral", mascotNeutral],
  ["left", mascotLeft],
  ["right", mascotRight],
  ["up", mascotUp],
  ["down", mascotDown],
];

const navigation = [
  ["How it works", "#how-it-works"],
  ["Features", "#features"],
  ["Pricing", "#pricing"],
  ["FAQs", "#faqs"],
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const scrollAnimationRef = useRef(0);
  const mascotArtRef = useRef(null);
  const [mascotPose, setMascotPose] = useState("neutral");
  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Account";
  const accountInitial = (user?.firstName?.[0] || user?.email?.[0] || "A").toUpperCase();

  function scrollToSection(event, href) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", href);
    if (scrollAnimationRef.current) window.cancelAnimationFrame(scrollAnimationRef.current);

    const headerHeight = document.querySelector(".landing-header")?.getBoundingClientRect().height || 0;
    const startY = window.scrollY;
    const targetY = Math.max(0, startY + target.getBoundingClientRect().top - headerHeight);
    const distance = targetY - startY;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1050;
    const startedAt = performance.now();

    if (!duration || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY);
      scrollAnimationRef.current = 0;
      return;
    }

    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) scrollAnimationRef.current = window.requestAnimationFrame(animate);
      else scrollAnimationRef.current = 0;
    };
    scrollAnimationRef.current = window.requestAnimationFrame(animate);
  }
  function handleMascotPointerMove(event) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    const horizontal = Math.abs(x) > 0.16;
    const vertical = Math.abs(y) > 0.2;
    const pose = vertical && Math.abs(y) > Math.abs(x)
      ? (y < 0 ? "up" : "down")
      : horizontal ? (x < 0 ? "left" : "right") : "neutral";
    setMascotPose(pose);
    mascotArtRef.current?.style.setProperty("--mascot-tilt", `${Math.max(-2, Math.min(2, x * 2))}deg`);
  }
  function resetMascotPointer() {
    setMascotPose("neutral");
    mascotArtRef.current?.style.setProperty("--mascot-tilt", "0deg");
  }
  async function handleSignOut() {
    setAccountMenuOpen(false);
    await logout().catch(() => {});
    navigate("/", { replace: true });
  }

  useEffect(() => {
    const closeAccountMenu = (event) => {
      const accountMenuIsTarget = event.composedPath().some((node) => node instanceof Element && node.closest(".landing-account-menu"));
      if (!accountMenuIsTarget) setAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (mobileNavRef.current?.contains(event.target) || mobileToggleRef.current?.contains(event.target)) return;
      setMobileMenuOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setMobileMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);



  return (
    <main className="landing-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="FocusLens home">
          <img src={brandMascot} alt="" />
          <span>FocusLens</span>
        </Link>

        <nav ref={mobileNavRef} className={`landing-nav${mobileMenuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <a href={href} key={label} onClick={(event) => { setMobileMenuOpen(false); scrollToSection(event, href); }}>{label}</a>
          ))}
          <div className="landing-mobile-actions">
            {isAuthenticated ? (
              <>
                <Link className="landing-button landing-button--primary" to="/overview" onClick={() => setMobileMenuOpen(false)}>Go to dashboard</Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Account settings</Link>
                <button type="button" onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="landing-button landing-button--light" to="/sign-in" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                <Link className="landing-button landing-button--primary" to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </nav>

        <button
          ref={mobileToggleRef}
          className="landing-mobile-menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <div className="landing-header-actions">
          {isAuthenticated ? (
            <>
              <Link className="landing-button landing-button--primary landing-dashboard-link" to="/overview">Go to dashboard</Link>
              <div className="landing-account-menu">
                <button
                  className="landing-account-trigger"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  onKeyDown={(event) => { if (event.key === "Escape") setAccountMenuOpen(false); }}
                >
                  <span className="landing-account-avatar" aria-hidden="true">{accountInitial}</span>
                  <span className="landing-account-name">{accountName}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {accountMenuOpen && (
                  <div className="landing-account-dropdown" role="menu">
                    <Link to="/profile" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Account settings</Link>
                    <button type="button" role="menuitem" onClick={handleSignOut}>Sign out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link className="landing-button landing-button--light landing-sign-in" to="/sign-in">Sign in</Link>
              <Link className="landing-button landing-button--primary landing-register" to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-inner">
          <div className="landing-copy">
            <p className="landing-eyebrow">STUDENT APP + PARENT DASHBOARD</p>
            <h1 id="landing-title">
              <span>Help them build focus.</span>
              <span className="landing-title-accent">Stay part of<br className="desktop-break" /> their progress.</span>
            </h1>
            <p className="landing-description">
              FocusLens guides your child through study sessions and gives you shared summaries to support their progress.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-button landing-button--primary landing-create-account" to="/register">Create parent account</Link>
              <a className="landing-button landing-button--light landing-how-button" href="#student-app" onClick={(event) => scrollToSection(event, "#student-app")}>See how it works</a>
            </div>
            <a className="landing-student-link" href="https://tally.so/r/yXXaV0">
              Student? Explore the app <ArrowRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </a>
          </div>
          <div className="landing-art" role="img" aria-label="FocusLens star mascot reading a book" onPointerMove={handleMascotPointerMove} onPointerDown={handleMascotPointerMove} onPointerLeave={resetMascotPointer}>
            <div className="landing-art-float">
              <div className="landing-art-poses" ref={mascotArtRef} aria-hidden="true">
                {mascotPoses.map(([pose, src]) => (
                  <img className={`landing-art-pose${mascotPose === pose ? " is-active" : ""}`} src={src} alt="" key={pose} draggable="false" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="landing-waves" aria-hidden="true">
          <img className="landing-wave landing-wave--top" src={topWave} alt="" />
          <img className="landing-wave landing-wave--middle" src={middleWave} alt="" />
          <img className="landing-wave landing-wave--bottom" src={bottomWave} alt="" />
        </div>
      </section>
      <GettingStartedSection />

      <LandingBenefitsSection />
      <StudentJourneySection />
      <FocusDistractionsSection />
      <ParentConversationSection />
      <ReasonsToReturnSection />
      <LandingPricingSection />
      <LandingFaqSection />
      <LandingFinalCtaSection />
      <LandingFooter />

    </main>
  );
}





























