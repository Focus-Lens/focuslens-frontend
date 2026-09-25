import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildProfile } from "../../context/ChildProfileContext";
import {
  AuthLayout,
  ParentLayout,
  Card,
} from "../../components/ui/CommonUI";

import { Check } from "lucide-react";

import logo from "../../assets/logo.png";

import "../../css/onboarding/InvitationSent.css";

export default function InvitationSent() {
  const navigate = useNavigate();
  const { child } = useChildProfile();
  const [showCopiedModal, setShowCopiedModal] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  async function copyInvitationLink() {
    if (isCopying) return;

    let invitation;
    try {
      invitation = JSON.parse(sessionStorage.getItem("childSetupInvitation") || "null");
    } catch {
      invitation = null;
    }
    const url = invitation?.invitationUrl || invitation?.setupUrl || invitation?.url;
    if (!url) {
      setCopyError(
        "This email invitation can’t be converted to a link after sending. Choose “Copy invitation link” before sending, or ask the server team to return a link with the email invitation."
      );
      return;
    }

    setCopyError("");
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      setShowCopiedModal(true);
    } catch (error) {
      setCopyError(error.message || "Could not copy the invitation link. Please try again.");
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <ParentLayout>
        <div className="invitation-sent-page">
          <Card>
            <div className="invitation-sent-card">

              {/* LOGO */}
              <div className="invitation-sent-logo">
                <img
                  src={logo}
                  alt="FocusLens"
                />
              </div>

              {/* TITLE */}
              <h1>
                Invitation sent to {child.preferredName}
              </h1>

              {/* EMAIL */}
              <p className="invitation-sent-email">
                Sent to {child.email}
              </p>

              {/* DESCRIPTION */}
              <p className="invitation-sent-description">
                Next, {child.preferredName} opens the invitation &amp; study
                progress will appear
                <br />
                after he starts study sessions.
              </p>

              {/* PRIMARY BUTTON */}
              <button
                className="invitation-sent-primary"
                onClick={() => navigate("/waiting-for-child")}
                type="button"
              >
                Go to dashboard
              </button>

              {/* SECONDARY BUTTON */}
              <button
                className="invitation-sent-secondary"
                onClick={copyInvitationLink}
                disabled={isCopying}
                type="button"
              >
                {isCopying ? "Getting invitation link..." : "Copy invitation link"}
              </button>
              {copyError && <p role="alert" className="invitation-link-error">{copyError}</p>}

              {/* FOOTNOTE */}
              <small>
                Invitation expires in 7 days. You can manage it from your
                dashboard.
              </small>

            </div>
          </Card>

          {/* COPIED MODAL */}
          {showCopiedModal && (
            <div className="sent-link-modal-overlay">
              <section className="sent-link-modal">

                <div className="sent-link-modal-icon">
                  <Check size={24} strokeWidth={2.5} />
                </div>

                <h2>
                  Invitation link copied
                </h2>

                <p>
                  Share it privately with {child.preferredName}.
                  <br />
                  The invitation expires in 7 days.
                </p>

                <button
                  onClick={() => setShowCopiedModal(false)}
                  type="button"
                >
                  Done
                </button>

              </section>
            </div>
          )}
        </div>
      </ParentLayout>
    </AuthLayout>
  );
}
