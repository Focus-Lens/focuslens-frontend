import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import LegalPolicyNavbar from "../landing/LegalPolicyNavbar";
import LandingFinalCtaSection from "../landing/LandingFinalCtaSection";
import LandingFooter from "../landing/LandingFooter";
import { ParentLayout } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import "../../css/legal/LegalDocument.css";

const fallbackTerms = [
  ["Acceptance of terms", "By using FocusLens, users acknowledge these terms. [Legal review: replace with approved acceptance language.]"],
  ["Account responsibilities", "Parents and students are responsible for account access and accurate account information. [Legal review: confirm obligations and limitations.]"],
  ["Parent and student connections", "Approved connections control relationship visibility. Connecting accounts does not provide unrestricted access to student information."],
  ["Acceptable use", "[Legal review required: add approved permitted and prohibited use language.]"],
  ["Privacy and personal information", "Use of personal information is described in the Privacy Policy. [Legal review: confirm the final cross-reference language.]"],
  ["Service availability", "[Legal review required: describe availability, maintenance, and service-change language.]"],
  ["Account suspension or termination", "[Legal review required: describe grounds, process, and effects of account suspension or termination.]"],
  ["Changes to the terms", "[Legal review required: explain how changes become effective and how users will be notified.]"],
  ["Contact and support", "[Legal review required: add approved support and legal contact details.]"],
];

const fallbackPrivacy = [
  ["Information we collect", "Parent account information and relationship information used to provide the parent experience.\n[Legal review: confirm the final categories and required disclosures.]"],
  ["How we use information", "Information is used to support account access, parent application features, and approved parent/student relationships. [Legal review: confirm the final purpose language.]"],
  ["Parent and student relationships", "Connected account visibility follows the approved relationship between the parent and student. [Legal review: confirm relationship controls and disclosures.]"],
  ["How information is shared", "[Legal review required: describe when information may be shared, with whom, and what safeguards or choices apply.]"],
  ["Data security and retention", "[Legal review required: describe security practices and approved retention language without stating unverified guarantees or time periods.]"],
  ["Privacy rights and choices", "[Legal review required: describe available privacy choices, request methods, eligibility, and any applicable limitations.]"],
  ["Contact and policy updates", "[Legal review required: add approved contact details and explain how policy updates will be communicated.]"],
];

const fallbackStudentPrivacy = [
  ["Information we collect", "Student account details, profile information, learning preferences, and study activity needed to provide the student app. [Legal review: confirm the final categories and required disclosures.]"],
  ["How we use information", "Information is used to provide account access, set up the student experience, support study sessions, and show learning progress. [Legal review: confirm the final purpose language.]"],
  ["Parent and student relationships", "A parent can view information made available through an approved connection. The student reviews the connection and the information shared before approving it. [Legal review: confirm relationship controls and disclosures.]"],
  ["How information is shared", "[Legal review required: describe when student information may be shared, with whom, and what safeguards or choices apply.]"],
  ["Data security and retention", "[Legal review required: describe security practices and approved retention language without stating unverified guarantees or time periods.]"],
  ["Privacy rights and choices", "[Legal review required: describe student privacy choices, request methods, eligibility, and any applicable limitations.]"],
  ["Contact and policy updates", "[Legal review required: add approved contact details and explain how policy updates will be communicated to students.]"],
];

function parseTerms(content) {
  const lines = String(content || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.length < 2 ? fallbackTerms : lines.reduce((all, line, index) => index % 2 ? all : [...all, [line, lines[index + 1] || ""]], []);
}

export default function LegalDocument({ type }) {
  const isPrivacy = type === "privacy";
  const location = useLocation();
  const [audience, setAudience] = useState("Parent");
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [document, setDocument] = useState(null);

  useEffect(() => {
    let active = true;
    setDocument(null);
    api(`/api/${isPrivacy ? "privacy" : "terms"}?audience=${audience}`, { auth: false })
      .then((result) => active && setDocument(result))
      .catch(() => active && setDocument({}));
    return () => { active = false; };
  }, [audience, isPrivacy]);

  const title = isPrivacy ? "Privacy Policy" : "Terms of Use";
  const sections = isPrivacy
    ? (document?.sections || (audience === "Student" ? fallbackStudentPrivacy : fallbackPrivacy)).map((item) => Array.isArray(item) ? item : [item.title, item.content])
    : parseTerms(document?.content);
  const updated = document?.publishedOnUtc
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(document.publishedOnUtc))
    : "[Month DD, YYYY]";
  const childId = new URLSearchParams(location.search).get("childId");
  const sectionIds = sections.map(([heading]) => heading.replaceAll(" ", "-"));
  const currentSectionId = activeSectionId || sectionIds[0] || "";

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = window.scrollY + 150;
        let current = sectionIds[0] || "";
        for (const id of sectionIds) {
          const section = window.document.getElementById(id);
          if (section && section.getBoundingClientRect().top + window.scrollY <= marker) current = id;
        }
        setActiveSectionId(current);
      });
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sectionIds.join("|")]);

  function goToSection(event, heading) {
    event.preventDefault();
    const id = heading.replaceAll(" ", "-");
    const target = window.document.getElementById(id);
    if (!target) return;
    setActiveSectionId(id);
    setIsTocOpen(false);
    const top = target.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  }

  function backToTop(event) {
    event.preventDefault();
    const firstSectionId = sectionIds[0];
    const target = firstSectionId && window.document.getElementById(firstSectionId);
    if (!target) return;

    setActiveSectionId(firstSectionId);
    setIsTocOpen(false);
    const top = target.getBoundingClientRect().top + window.scrollY - 168;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${firstSectionId}`);
  }

  const note = isPrivacy
    ? (childId ? "This view reflects the information available through the selected child connection." : audience === "Student" ? "Your study information is shared with a parent only through a connection you review and approve." : "FocusLens only shows parents information associated with their account and approved student connections.")
    : "Connecting a parent and student account does not automatically provide unrestricted access to all student information. Visibility depends on the approved relationship and FocusLens privacy rules.";

  return (
    <div className={`legal-page-shell${isPrivacy ? "" : " legal-page-shell--terms"}`}>
      <LegalPolicyNavbar />
      <ParentLayout>
        <main className="legal-page">
          <header className="legal-policy-intro" id="legal-page-top">
            <div className="legal-policy-intro-inner">
              <h1>{title}</h1>
              <p>{isPrivacy ? "Learn what information FocusLens uses and how it is protected." : "The rules and responsibilities that apply when using FocusLens."}</p>
              <small>Last updated: {updated}</small>
            </div>
          </header>
          <div className="legal-policy-content">
            <div className="legal-audience" role="tablist" aria-label="Choose policy audience">
              {["Parent", "Student"].map((option) => (
                <button key={option} type="button" role="tab" aria-selected={audience === option} className={audience === option ? "active" : ""} onClick={() => setAudience(option)}>{option}</button>
              ))}
            </div>
            <div className="legal-summary-grid">
              <section className={audience === "Parent" ? "active" : ""}>
                <b>Parent summary</b>
                <p>FocusLens uses account and relationship information to provide the parent application experience, secure user access, and support parent/student relationships.</p>
              </section>
              <section className={audience === "Student" ? "active" : ""}>
                <b>Student summary</b>
                <p>FocusLens uses account, profile, and learning preference information to provide the student application experience, secure user access, and support learning workflows.</p>
              </section>
            </div>
              <section key={audience} className="legal-document-card">
              <aside>
                <b>On this page</b>
                <button type="button" className="legal-toc-toggle" aria-expanded={isTocOpen} onClick={() => setIsTocOpen((open) => !open)}>
                  <span className="legal-toc-current"><small>On this page</small><strong>{sections.find(([heading]) => heading.replaceAll(" ", "-") === currentSectionId)?.[0] || ""}</strong></span>
                  <span className="legal-toc-chevron" aria-hidden="true">⌄</span>
                </button>
                <nav className={`legal-toc-links${isTocOpen ? " is-open" : ""}`} aria-label="On this page">
                  {sections.map(([heading]) => {
                    const id = heading.replaceAll(" ", "-");
                    return <a key={heading} className={id === currentSectionId ? "active" : ""} href={`#${id}`} onClick={(event) => goToSection(event, heading)}>{heading}</a>;
                  })}
                </nav>
              </aside>
              <div className="legal-content">
                {sections.map(([heading, content]) => <article id={heading.replaceAll(" ", "-")} key={heading}><h2>{heading}</h2><p>{content}</p></article>)}
              </div>
              <p className="legal-note"><span aria-hidden="true">◈</span>{note}</p>
              <a className="legal-back-to-top" href="#legal-page-top" onClick={backToTop}>Back to top ↑</a>
            </section>
          </div>
        </main>
      </ParentLayout>
      <LandingFinalCtaSection />
      <LandingFooter />
    </div>
  );
}
