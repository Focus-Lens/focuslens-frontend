import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import brandMascot from "../../assets/logo.png";
import "../../css/landing/LandingPage.css";

const links = [
  ["Privacy policy", "/privacy-policy"],
  ["Terms of use", "/terms-of-use"],
];

export default function LegalPolicyNavbar() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (navRef.current?.contains(event.target) || toggleRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <header className="landing-header legal-policy-header">
      <Link className="landing-brand" to="/" aria-label="FocusLens home">
        <img src={brandMascot} alt="" />
        <span>FocusLens</span>
      </Link>
      <nav ref={navRef} className={`legal-policy-nav${menuOpen ? " is-open" : ""}`} aria-label="Legal pages">
        {links.map(([label, href]) => (
          <Link
            key={href}
            to={href}
            aria-current={pathname === href ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <Link className="landing-button landing-button--light legal-policy-back" to="/" onClick={() => setMenuOpen(false)}>
          Back to FocusLens
        </Link>
      </nav>
      <button
        ref={toggleRef}
        className="legal-policy-menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span /><span /><span />
      </button>
    </header>
  );
}
