import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import LandingFinalCtaSection from "./LandingFinalCtaSection";
import LandingFooter from "./LandingFooter";
import { useAuth } from "../../context/useAuth";
import brandMascot from "../../assets/logo.png";
import "../../css/landing/LandingPage.css";

const navigation = [
  ["How it works", "/#student-app"],
  ["Features", "/#features"],
  ["Pricing", "/#pricing"],
  ["FAQs", "/faqs"],
];

export default function LandingCompatibilityPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileNavRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const accountName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email?.split("@")[0] || "Account";
  const accountInitial = (user?.firstName?.[0] || user?.email?.[0] || "A").toUpperCase();

  useEffect(() => {
    const closeAccountMenu = (event) => {
      const insideMenu = event.composedPath().some((node) => node instanceof Element && node.closest(".landing-account-menu"));
      if (!insideMenu) setAccountMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      const target = event.target;
      if (mobileNavRef.current?.contains(target) || mobileToggleRef.current?.contains(target)) return;
      setMobileMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  async function handleSignOut() {
    setAccountMenuOpen(false);
    await logout().catch(() => {});
    navigate("/", { replace: true });
  }

  return (
    <main className="landing-page landing-compatibility-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="FocusLens home">
          <img src={brandMascot} alt="" />
          <span>FocusLens</span>
        </Link>
        <nav ref={mobileNavRef} className={`landing-nav${mobileMenuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {navigation.map(([label, href]) => (
            <Link to={href} key={label} onClick={() => setMobileMenuOpen(false)}>{label}</Link>
          ))}
          <div className="landing-compatibility-mobile-actions">
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
          className="landing-compatibility-menu-toggle"
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
                <button className="landing-account-trigger" type="button" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)} onKeyDown={(event) => { if (event.key === "Escape") setAccountMenuOpen(false); }}>
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

      <section className="landing-compatibility-hero" aria-labelledby="compatibility-title">
        <div className="landing-compatibility-hero-inner">
          <p className="landing-faq-intro-eyebrow">DEVICES &amp; STUDY MODES</p>
          <h1 id="compatibility-title">Find the right setup for your family.</h1>
          <p className="landing-faq-intro-description">
            A parent dashboard for shared progress.<br />
            A student app for the study session. Here’s how the two fit together.
          </p>
        </div>
      </section>

      <section className="landing-compatibility-experiences" aria-labelledby="compatibility-experiences-title">
        <div className="landing-compatibility-experiences-inner">
          <h2 id="compatibility-experiences-title">
            Two experiences. <span>One connected routine.</span>
          </h2>
          <div className="landing-compatibility-experience-grid">
            <article className="landing-compatibility-experience-card">
              <p className="landing-compatibility-card-eyebrow">FOR PARENTS</p>
              <h3>Parent dashboard</h3>
              <p className="landing-compatibility-card-description">
                A browser-based dashboard for creating your parent account, connecting a child and reviewing shared study summaries.
              </p>
              <p className="landing-compatibility-card-setup">Intended setup: laptop or desktop browser</p>
            </article>
            <article className="landing-compatibility-experience-card">
              <p className="landing-compatibility-card-eyebrow">FOR STUDENTS</p>
              <h3>Student app</h3>
              <p className="landing-compatibility-card-description">
                A mobile study experience for choosing a session, working with paper or digital material and reviewing progress.
              </p>
              <p className="landing-compatibility-card-setup">Intended setup: mobile device</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-compatibility-modes" aria-labelledby="compatibility-modes-title">
        <div className="landing-compatibility-modes-inner">
          <h2 id="compatibility-modes-title">Study with paper or on screen.</h2>
          <p className="landing-compatibility-modes-intro">
            Choose the mode that matches your study material. Available insights differ between modes.
          </p>
          <div className="landing-compatibility-mode-list">
            <article className="landing-compatibility-mode-card">
              <h3>Paper mode</h3>
              <p>Keep a printed book open on the selected pages while FocusLens guides the session.</p>
              <p className="landing-compatibility-mode-ready">Have ready: your printed material and the student app.</p>
            </article>
            <article className="landing-compatibility-mode-card">
              <h3>Digital mode</h3>
              <p>Read the selected study content in the app with session controls and learning checks.</p>
              <p className="landing-compatibility-mode-ready">Have ready: your study file or selected digital content.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-compatibility-start" aria-labelledby="compatibility-start-title">
        <div className="landing-compatibility-start-inner">
          <h2 id="compatibility-start-title">See how to get started.</h2>
          <p>Follow the setup guide or explore the student app before your first session.</p>
          <div className="landing-compatibility-start-actions">
            <Link className="landing-compatibility-start-primary" to="/get-started-connected">
              Getting started guide
            </Link>
            <a className="landing-compatibility-start-secondary" href="https://tally.so/r/yXXaV0">
              Explore the student app
            </a>
          </div>
        </div>
      </section>

      <LandingFinalCtaSection />
      <LandingFooter />
    </main>
  );
}
