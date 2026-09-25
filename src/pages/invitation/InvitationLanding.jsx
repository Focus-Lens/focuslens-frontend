import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { resolveAccessInvitation } from "../../services/api";
import "../../css/invitation/InvitationLanding.css";
import logo from "../../assets/logo.png";

export default function InvitationLanding() {
  const { token } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [invitation, setInvitation] = useState(() => token ? null : {
    studentPreferredName: "Youssef",
    expiresAtUtc: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    sessionStorage.setItem("pendingInvitationToken", token);
    resolveAccessInvitation(token)
      .then((data) => {
        sessionStorage.setItem("pendingInvitationName", data.studentPreferredName);
        setInvitation(data);
      })
      .catch((requestError) => {
        sessionStorage.removeItem("pendingInvitationToken");
        sessionStorage.removeItem("pendingInvitationName");
        setError(requestError.message);
      });
  }, [token]);

  const childName = invitation?.studentPreferredName;
  const expiresIn = invitation?.expiresAtUtc
    ? new Date(invitation.expiresAtUtc).toLocaleDateString()
    : "7 days";

  return (
    <div className="invitation-landing-page">
      <header className="invitation-landing-header">
        <Link className="invitation-landing-brand" to="/">
          <img className="focuslens-logo" src={logo} alt="FocusLens Logo" />
          <span>FocusLens</span>
        </Link>

        <nav className="invitation-landing-nav">
          <div className="invitation-landing-desktop-links">
            <Link className="invitation-landing-signin" to="/sign-in">
              Sign in
            </Link>

            <Link className="invitation-landing-register" to="/register">
              Register
            </Link>
          </div>

          <button
            type="button"
            className="invitation-landing-menu-button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {menuOpen && (
            <div className="invitation-landing-mobile-menu">
              <Link to="/sign-in" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>

              <Link to="/register" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="invitation-landing-main">
        <section className="invitation-landing-card">
          {error ? <p>{error}</p> : !invitation ? <p>Loading invitation…</p> : <>
            <div className="invitation-landing-avatar">{childName?.[0] || "?"}</div>
            <h1>{childName} invited you to FocusLens</h1>
            <p>{childName} invited you to support their study progress.<br />You&apos;ll only see the information they choose to share.</p>
            <Link
              className="invitation-landing-continue"
              to={token ? `/invite/${token}/continue` : "/invite/continue"}
              state={{ invitationName: childName }}
            >
              Continue <span>→</span>
            </Link>
            <small>◷ Invitation expires {invitation.expiresAtUtc ? `on ${expiresIn}` : `in ${expiresIn}`}</small>
          </>}
        </section>
      </main>


    </div>
  );
}
