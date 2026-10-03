import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildProfile } from "../../context/useChildProfile";
import {
  AuthLayout,
  ParentLayout,
  Card,
} from "../../components/ui/CommonUI";

import { Check } from "lucide-react";

import logo from "../../assets/logo.png";

import "../../css/onboarding/InvitationSent.css";
import { copyText } from "../../services/clipboard";

export default function InvitationSent() {
  const navigate = useNavigate();
  const { child } = useChildProfile();
  const [showCopiedModal, setShowCopiedModal] = useState(false);
  // When the child sets up their own profile there is no name yet, and the
  // email only exists on the invitation that was just sent.
  const [sentInvitation] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("childSetupInvitation") || "null");
    } catch {
      return null;
    }
  });
  const childName = child.preferredName;
  const displayedName = childName || "your child";
  // The same confirmation is shown after copying the link instead of emailing.
  const isLinkDelivery = sentInvitation?.delivery === "link";
  const sentToEmail = isLinkDelivery ? "" : child.email || sentInvitation?.childEmail;
  const [copyError, setCopyError] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  // The button itself confirms the copy, so the result is visible even if the
  // confirmation dialog is dismissed or never noticed.
  const [justCopied, setJustCopied] = useState(false);

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
      await copyText(url);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 2500);
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
                {isLinkDelivery
                  ? "Invitation link copied"
                  : childName
                    ? `Invitation sent to ${childName}`
                    : "Invitation sent"}
              </h1>

              {/* EMAIL */}
              {sentToEmail && (
                <p className="invitation-sent-email">
                  Sent to {sentToEmail}
                </p>
              )}

              {/* DESCRIPTION */}
              {isLinkDelivery && (
                <p className="invitation-sent-email">
                  Share it privately with {displayedName}.
                </p>
              )}

              <p className="invitation-sent-description">
                Next, {displayedName} opens the invitation &amp; study
                progress will appear{" "}
                <br />
                after he/she starts study sessions.
              </p>

              {/* PRIMARY BUTTON */}
              <button
                className="invitation-sent-primary"
                onClick={() => navigate("/overview", { replace: true })}
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
                {isCopying
                  ? "Copying..."
                  : justCopied
                    ? "Link copied ✓"
                    : "Copy invitation link"}
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
                  Share it privately with {displayedName}.
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
