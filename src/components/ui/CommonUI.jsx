import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../../css/common/CommonUI.css";
import logo from "../../assets/logo.png";
import React from "react";

export function Button({ children, to, secondary = false, ...props }) {
  const className = secondary ? "button button-secondary" : "button";

  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, className = "", ...props }) {
  return (
    <fieldset className={`field ${className}`}>
      <legend>{label}</legend>
      <input {...props} />
    </fieldset>
  );
}

export function AuthLayout({
  children,
  hideFooter = false,
  headerVariant = "default",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user: parent } = useAuth();
  const isOnboardingHeader =
    headerVariant === "onboarding" ||
    location.pathname === "/setup-intro" ||
    location.pathname.startsWith("/setup/") ||
    location.pathname === "/waiting-for-child";

  return (
    <div className="app-shell auth-shell">
      <header
        className={`auth-header ${
          isOnboardingHeader ? "auth-header-onboarding" : ""
        }`}
      >
        <Link className="brand" to={isOnboardingHeader ? "/overview" : "/"}>
          <img
            src={logo}
            alt="FocusLens Logo"
            className="auth-logo"
          />

          <span className="brand-name">FocusLens</span>
        </Link>

        {isOnboardingHeader ? (
          <Link
            to="/profile"
            className="onboarding-parent-profile"
            aria-label="Open Mariam's profile"
          >
            <span className="onboarding-parent-avatar">
              {parent.firstName?.[0] ?? "M"}
            </span>

            <span>{parent.firstName}</span>

            <ChevronDown size={14} strokeWidth={1.8} />
          </Link>
        ) : (
          <nav className="auth-nav">
            <Link className="sign-in-nav" to="/sign-in">
              Sign in
            </Link>

            <Link className="register-nav" to="/register">
              Register
            </Link>

            <button
              type="button"
              className="auth-menu-button"
              onClick={() => setMenuOpen((previous) => !previous)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>

            {menuOpen && (
              <div className="auth-mobile-menu">
                <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
                  Sign in
                </Link>

                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="auth-main">{children}</main>

      {!hideFooter && (
        <footer className="auth-footer">
          <div className="auth-footer-left">
            <span className="trust-text">
              <span className="trust-icon">♧</span>
              Student Trust &amp; Agency Protocol Active
            </span>

            <span className="footer-dot">·</span>
            <span>FocusLens Parent Web v1.0</span>
          </div>

          <div className="auth-footer-right">
            <span>Parent Coaching Guides</span>
            <span>Privacy Commitment</span>
            <span>Support &amp; Feedback</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export function ParentLayout({ children, step }) {
  const steps = [
    "Basic info",
    "Studies",
    "Context",
    "Goal",
    "Review",
    "Invite",
  ];

  const stepper = step ? (
    <div className="stepper">
      {steps.map((item, index) => (
        <div
          className={index + 1 <= step ? "step active" : "step"}
          key={item}
        >
          <b>{index + 1 < step ? "✓" : index + 1}</b>
          <span>{item}</span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className="app-shell">
      {/* <header className="parent-header">
        <Link className="brand" to="/overview">
          FocusLens
        </Link>

        <nav>
          <NavLink to="/overview">Overview</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <NavLink to="/study-goals">Study Goals</NavLink>
          <NavLink to="/children">Children</NavLink>
        </nav>

        <NavLink className="person" to="/profile">
          {parent.hasChild && (
            <>
              <span className="avatar">{child.preferredName[0]}</span>
              {child.preferredName} · {child.grade}
            </>
          )}

          <span className="avatar parent-avatar">
            {parent.firstName[0]}
          </span>

          {parent.firstName}
        </NavLink>
      </header> */}

      <main className="parent-main">
        {React.cloneElement(children, {
          stepper,
        })}
      </main>

      {/* footer */}
    </div>
  );
}

export function Card({ title, eyebrow, children, stepper }) {
  return (
    <section className="page-card">
      {stepper}

      {eyebrow && <p className="eyebrow">{eyebrow}</p>}

      {title && <h1>{title}</h1>}

      {children}
    </section>
  );
}
