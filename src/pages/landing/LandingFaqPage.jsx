import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import brandMascot from "../../assets/logo.png";
import LandingFinalCtaSection from "./LandingFinalCtaSection";
import LandingFooter from "./LandingFooter";
import "../../css/landing/LandingPage.css";

const faqTopics = [
  ["Getting started", "getting-started"],
  ["Study sessions", "study-sessions"],
  ["Parent connection", "parent-connection"],
  ["Progress", "progress"],
  ["Plans & pricing", "plans-pricing"],
  ["Privacy & devices", "privacy-devices"],
];

const faqSections = [
  {
    id: "getting-started",
    title: "About FocusLens & getting started",
    questions: [
      ["What is FocusLens?", "FocusLens brings a student study app and a parent dashboard together. Students plan study sessions, work with their study material and review their progress. Parents can follow shared summaries after their child approves the connection."],
      ["How do we get started?", "Create a parent account, add your child’s details and send an invitation. Your child creates their student account, reviews what will be shared and approves the connection. The Getting started guide walks through each step."],
      ["Do parents and students use the same account?", "Parents use their own account and dashboard. Students use a separate account in the student app. An invitation connects the two accounts after the student reviews and approves it."],
      ["Where can I see the setup walkthrough?", "Open Help for a visual guide covering parent setup, inviting a child, creating the student account, approving the connection and starting a first study session.", "Help"],
    ],
  },
  {
    id: "study-sessions",
    title: "Study sessions",
    questions: [
      ["What do students choose before a session?", "Students choose a subject, paper or digital study mode, a session length and the study material or pages they want to cover. They can review these choices before starting."],
      ["Can my child study with a printed book?", "Yes. Paper mode lets students keep a printed book open while FocusLens guides the session. Paper and digital modes offer different study experiences and available insights."],
      ["What happens in digital mode?", "Digital mode presents study content in the app with session controls. Students can work through the material, pause when needed and review their session afterward."],
      ["What are learning checks and session summaries?", "Learning checks ask short questions based on the study material. After a session, the summary brings together its highlights and study details so students can review what happened."],
    ],
  },
  {
    id: "parent-connection",
    title: "Connecting parents & children",
    questions: [
      ["How do I invite my child?", "During parent setup, enter your child’s email address to send an invitation, or use the invitation link shown in the flow. Your child then reviews the connection in the student app."],
      ["Does my child approve the connection?", "Yes. Your child reviews the listed sharing information and approves the connection in the student app before the accounts are connected."],
      ["What can a parent see?", "Connected parents can see shared study and focus time, sessions and subjects, progress and streaks, and weekly goals. The connection screen explains that this information is shared automatically while the connection is active."],
      ["Can I connect more than one child?", "The Family plan supports up to three connected children. Each child has separate allowances and a separate view in the parent dashboard. Family allowances are not pooled."],
    ],
  },
  {
    id: "progress",
    title: "Progress & motivation",
    questions: [
      ["How can students review their progress?", "Students can review session summaries and session details, then follow their study progress, streaks and goals in the app. These views help make a developing study routine visible."],
      ["What are missions and achievements?", "Missions give students study activities to work toward. Achievements and points recognize their effort, while the level path shows progress toward the next level. Available features depend on the selected plan."],
      ["What can parents use shared summaries for?", "Parents can review the shared sessions, subjects and progress to start a more informed conversation. A simple question such as “What felt clearer today?” can help turn a summary into encouragement."],
      ["Where do I find more detail about a session?", "Open a session’s details to review its summary and highlights. The student flow includes a full report, and the parent Reports view includes shared session history and a View details action."],
    ],
  },
  {
    id: "plans-pricing",
    title: "Plans, sessions & AI credits",
    questions: [
      ["What is included in Free?", "Free includes one connected child, 10 study sessions per month and 30 AI credits per month, with core gamification and a one-child parent dashboard."],
      ["How do sessions and AI credits differ?", "Study sessions and AI credits are separate monthly allowances. Sessions cover study use; AI credits are used for supported AI actions. The pricing cards show both allowances for each plan."],
      ["How do Plus and Family compare?", "Plus includes one connected child, 50 sessions and 180 AI credits per month, weekly missions, full achievements and mascot levels 1–5. Family supports up to three children, with 50 sessions and 180 credits per child per month, separate analytics and a child switcher."],
      ["Can I choose monthly or yearly billing?", "Yes. The pricing section offers monthly and yearly options in EGP. Yearly prices are billed as annual totals, while the session and AI-credit allowances still renew monthly. Review the selected billing period and plan details before continuing.", "Compare plans", "/#pricing"],
    ],
  },
  {
    id: "privacy-devices",
    title: "Privacy, accounts & devices",
    questions: [
      ["Where can we review the privacy policy?", "The Privacy Policy pages explain the information covered by FocusLens’s parent and student accounts. Review the policy for the account you use, along with the sharing information shown before connecting.", "Privacy policy"],
      ["Where can I read the account and subscription terms?", "The Terms of Use pages cover parent and student account terms. Review the applicable terms for billing and account-related guidance before making a subscription decision.", "Terms of use"],
      ["Which devices can I use?", "Device compatibility and official download destinations are still awaiting launch confirmation. Open the compatibility information for the current status before choosing a device for FocusLens.", "Compatibility"],
      ["Where can I find more help with setup?", "The Getting started guide follows the parent and student flows from account creation through the invitation, connection and first study session. Use the step navigation to return to the part you need.", "Open Help"],
    ],
  },
];

const navigation = [
  ["How it works", "/#student-app"],
  ["Features", "/#features"],
  ["Pricing", "/#pricing"],
  ["FAQs", "/#faqs"],
];

export default function LandingFaqPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState(() => new Set());
  const scrollAnimationRef = useRef(0);
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

  function scrollBackToTopics(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById("faq-page-title");
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", "#faq-page-title");
    if (scrollAnimationRef.current) window.cancelAnimationFrame(scrollAnimationRef.current);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("faq-topics")?.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });

    const headerHeight = document.querySelector(".landing-header")?.getBoundingClientRect().height || 0;
    const startY = window.scrollY;
    const targetY = Math.max(0, startY + target.getBoundingClientRect().top - headerHeight);
    const distance = targetY - startY;
    const duration = reduceMotion ? 0 : 1050;
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

  function toggleFaq(id) {
    setOpenFaqs((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSignOut() {
    setAccountMenuOpen(false);
    await logout().catch(() => {});
    navigate("/", { replace: true });
  }

  return (
    <main className="landing-page landing-faq-placeholder-page">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="FocusLens home">
          <img src={brandMascot} alt="" />
          <span>FocusLens</span>
        </Link>
        <nav ref={mobileNavRef} className={`landing-nav${mobileMenuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {navigation.map(([label, href]) => <a href={href} key={label} onClick={() => setMobileMenuOpen(false)}>{label}</a>)}
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
        <button ref={mobileToggleRef} className="landing-mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
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
      <section className="landing-faq-intro" aria-labelledby="faq-page-title">
        <div className="landing-faq-intro-inner">
          <p className="landing-faq-intro-eyebrow">FOCUSLENS HELP CENTRE</p>
          <h1 id="faq-page-title">FocusLens — Frequently Asked Questions</h1>
          <p className="landing-faq-intro-description">
            Answers about getting started, study sessions, parent connections and choosing a plan.
          </p>
          <nav className="landing-faq-jump" id="faq-topics" aria-label="Jump to FAQ topic">
            <span className="landing-faq-jump-label">Jump to:</span>
            {faqTopics.map(([label, id]) => (
              <a href={`#${id}`} key={id}>{label}</a>
            ))}
          </nav>
        </div>
      </section>
      <div className="landing-full-faq-content">
        {faqSections.map((section, sectionIndex) => (
          <section className="landing-full-faq-section" id={section.id} aria-labelledby={`${section.id}-title`} key={section.id}>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <div className="landing-full-faq-list">
              {section.questions.map(([question, answer, actionLabel, actionHref], questionIndex) => {
                const id = `faq-${sectionIndex}-${questionIndex}`;
                const isOpen = openFaqs.has(id);
                const answerId = `${id}-answer`;
                return (
                  <article className={`landing-full-faq-item${isOpen ? " is-open" : ""}`} key={id}>
                    <button className="landing-full-faq-question" type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => toggleFaq(id)}>
                      <span>{question}</span>
                      <span className="landing-full-faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </button>
                    <div className="landing-full-faq-answer" id={answerId} aria-hidden={!isOpen}>
                      <div>
                        <p>{answer}</p>
                        {actionLabel && (actionHref
                          ? <a className="landing-full-faq-action" href={actionHref}>{actionLabel} →</a>
                          : <span className="landing-full-faq-action">{actionLabel} →</span>)}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <a className="landing-full-faq-back" href="#faq-page-title" onClick={scrollBackToTopics}>Back to topics ↑</a>
          </section>
        ))}
      </div>
      <section className="landing-faq-guide-cta" aria-labelledby="faq-guide-cta-title">
        <h2 id="faq-guide-cta-title">See the steps, one at a time.</h2>
        <p>Our visual guide takes you from creating a parent account to<br className="landing-faq-guide-break" /> connecting your child and starting a session.</p>
        <Link to="/get-started-connected">Explore the Getting started guide →</Link>
      </section>
      <LandingFinalCtaSection />
      <LandingFooter />
    </main>
  );
}
