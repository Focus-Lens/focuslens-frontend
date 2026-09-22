import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { ParentLayout } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import "../../css/legal/LegalDocument.css";

const fallbackTerms = [["Acceptance of terms", "By using FocusLens, users acknowledge these terms."], ["Account responsibilities", "Parents are responsible for account access and accurate account information."], ["Parent and student connections", "Approved connections control relationship visibility and do not provide unrestricted access to student information."], ["Acceptable use", "FocusLens must be used in a safe and respectful way."], ["Privacy and personal information", "Use of personal information is described in the Privacy Policy."], ["Service availability", "Service availability and maintenance may change as the product evolves."], ["Contact and support", "Contact support for questions about these terms."]];
const fallbackPrivacy = [["Information we collect", "FocusLens uses account, profile, and approved relationship information to provide the application experience."], ["How we use information", "Information is used to support account access, approved learning workflows, and features the user has chosen to use."], ["Parent and student relationships", "An approved connection controls what information is visible. Connecting accounts does not provide unrestricted access to student information."], ["How information is shared", "Only information selected for sharing through an active relationship is available to the connected parent."], ["Data security and retention", "FocusLens applies safeguards appropriate to the service and retains information only as needed for the service."], ["Privacy rights and choices", "Users can review their account information and manage available account settings from their profile."], ["Contact and policy updates", "Material policy updates will be published here with an updated version and date."]];
function parseTerms(content) { const lines = String(content || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean); return lines.length < 2 ? fallbackTerms : lines.reduce((all, line, index) => index % 2 ? all : [...all, [line, lines[index + 1] || ""]], []); }

export default function LegalDocument({ type }) {
  const isPrivacy = type === "privacy"; const location = useLocation(); const [audience, setAudience] = useState("Parent"); const [document, setDocument] = useState(null);
  useEffect(() => { let active = true; api(`/api/${isPrivacy ? "privacy-policy" : "terms"}?audience=${audience}`, { auth: false }).then((result) => active && setDocument(result)).catch(() => active && setDocument({})); return () => { active = false; }; }, [audience, isPrivacy]);
  const title = isPrivacy ? "Privacy Policy" : "Terms of Use"; const sections = isPrivacy ? (document?.sections || fallbackPrivacy).map((item) => Array.isArray(item) ? item : [item.title, item.content]) : parseTerms(document?.content); const updated = document?.publishedOnUtc ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(document.publishedOnUtc)) : "Current version"; const childId = new URLSearchParams(location.search).get("childId");
  function goToSection(event, heading) {
    event.preventDefault();
    const id = heading.replaceAll(" ", "-");
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
  }
  const note = isPrivacy
    ? (childId ? "This view reflects the information available through the selected child connection." : "FocusLens only shows parent information associated with your account and approved student connections.")
    : "Connecting a parent and student account does not automatically provide unrestricted access to all student information. Visibility depends on the approved relationship and FocusLens privacy rules.";
  return <div className="legal-page-shell"><DashboardHeader activePage={null} /><ParentLayout><main className="legal-page"><header className="legal-heading"><div><h1>{title}</h1><p>{isPrivacy ? "Learn what information FocusLens uses and how it is protected." : "The rules and responsibilities that apply when using FocusLens."}</p></div><small>Last updated: {updated}</small></header><div className="legal-audience">{["Parent", "Student"].map((option) => <button key={option} type="button" className={audience === option ? "active" : ""} onClick={() => setAudience(option)}>{option}</button>)}</div><div className="legal-summary-grid"><section className={audience === "Parent" ? "active" : ""}><b>Parent summary</b><p>Parent account information and approved relationship data support the parent experience.</p></section><section className={audience === "Student" ? "active" : ""}><b>Student summary</b><p>Student profile and learning preferences support the student experience and learning workflows.</p></section></div><section className="legal-document-card"><aside><b>On this page</b>{sections.map(([heading]) => <a key={heading} href={`#${heading.replaceAll(" ", "-")}`} onClick={(event) => goToSection(event, heading)}>{heading}</a>)}</aside><div className="legal-content">{sections.map(([heading, content]) => <article id={heading.replaceAll(" ", "-")} key={heading}><h2>{heading}</h2><p>{content}</p></article>)}</div></section><p className="legal-note"><span aria-hidden="true">◈</span>{note}</p></main></ParentLayout></div>;
}
