import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { child as mockChild, invitation as mockInvitation } from "../../data/mockData";
import { resolveParentInvitation } from "../../services/access";
import "../../css/invitation/InvitationLanding.css";
import logo from "../../assets/logo.png";

export default function InvitationLanding() {
  const { token = mockInvitation.token } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const [childName, setChildName] = useState(mockChild.preferredName);
  const [expiresIn, setExpiresIn] = useState(mockChild.invitationExpiresIn);

  useEffect(() => {
    sessionStorage.setItem("pendingInvitationToken", token);
  }, [token]);

  useEffect(() => {
    let isCancelled = false;

    async function loadInvitation() {
      try {
        const data = await resolveParentInvitation(token);

        if (isCancelled || !data) return;

        if (data.childPreferredName || data.preferredName || data.childName) {
          setChildName(
            data.childPreferredName || data.preferredName || data.childName
          );
        }

        if (data.expiresIn || data.invitationExpiresIn) {
          setExpiresIn(data.expiresIn || data.invitationExpiresIn);
        }
      } catch {
        // نبقي على القيم الافتراضية لو تعذر جلب بيانات الدعوة
      }
    }

    loadInvitation();

    return () => {
      isCancelled = true;
    };
  }, [token]);

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
          <div className="invitation-landing-avatar">
            {childName[0]}
          </div>

          <h1>{childName} invited you to FocusLens</h1>

          <p>
            {childName} invited you to support his study progress.
            <br />
            You&apos;ll only see the information he chooses to share.
          </p>

          <Link
            className="invitation-landing-continue"
            to={`/invite/${token}/continue`}
          >
            Continue <span>→</span>
          </Link>

          <small>
            ◷ Invitation expires in {expiresIn}
          </small>
        </section>
      </main>


    </div>
  );
}
