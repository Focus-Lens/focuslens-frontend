import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import brandMascot from "../../assets/logo.png";
import facebookIcon from "../../assets/landing/facebook-icon.svg";
import instagramIcon from "../../assets/landing/instagram-icon.svg";
import linkedinIcon from "../../assets/landing/linkedin-icon.svg";

const columns = [
  { title: "Explore", links: [["How it works", "#how-it-works"], ["For parents", "#parent-conversation"], ["Pricing", "#pricing"]] },
  { title: "Support", links: [["FAQs", "/faqs"], ["Compatibility", "/compatibility"], ["Help", "/get-started-connected#guide-steps"]] },
  { title: "Legal & account", links: [["Privacy policy", "/privacy-policy"], ["Terms of use", "/terms-of-use"], ["Parent sign in", "/sign-in"]] },
];

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/share/19kTeVFGdi/", icon: facebookIcon },
  { label: "Instagram", href: "https://www.instagram.com/focuslens.app?xtok=aGJzd3hneGJ0M3Jz", icon: instagramIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/focuslens-app/", icon: linkedinIcon },
];

function scrollToLandingSection(event, href, animationRef) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const isLandingPageAnchor = href.startsWith("#") || href.startsWith("/#");
  if (href.startsWith("/#") && window.location.pathname !== "/") return;
  const targetId = href.startsWith("/#") ? href.slice(2) : href.slice(1);
  const target = isLandingPageAnchor ? document.getElementById(targetId) : null;
  if (!target) return;
  event.preventDefault();
  window.history.pushState(null, "", href);
  if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
  const headerHeight = document.querySelector(".landing-header")?.getBoundingClientRect().height || 0;
  const startY = window.scrollY;
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

export default function LandingFooter() {
  const scrollAnimationRef = useRef(0);
  const { pathname } = useLocation();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand-block">
          <div className="landing-footer-brand">
            <img src={brandMascot} alt="" />
            <span>FocusLens</span>
          </div>
          <p>Focus for students.<br />Connection for families.</p>
          <nav className="landing-footer-socials" aria-label="Social media">
            {socials.map(({ label, href, icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                <img src={icon} alt="" />
              </a>
            ))}
          </nav>
        </div>
        {columns.map(({ title, links }) => (
          <div className="landing-footer-column" key={title}>
            <h2>{title}</h2>
            {links.map((item) => {
              const [label, href] = Array.isArray(item) ? item : [item, null];
              const resolvedHref = href?.startsWith("#") && pathname !== "/" ? `/${href}` : href;
            const returnToPageTop = (event) => {
              if (resolvedHref !== pathname) return;
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            };
              return resolvedHref
              ? <Link key={label} to={resolvedHref} onClick={(event) => { returnToPageTop(event); scrollToLandingSection(event, resolvedHref, scrollAnimationRef); }}>{label}</Link>
                : <span key={label}>{label}</span>;
            })}
          </div>
        ))}
        <div className="landing-footer-bottom">© 2026 FocusLens. All rights reserved.</div>
      </div>
    </footer>
  );
}


