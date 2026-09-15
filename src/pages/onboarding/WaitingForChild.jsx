import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Check, Clock3 } from "lucide-react";

import { ParentLayout, Button } from "../../components/ui/CommonUI";
import { child } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import {
  resendChildSetupInvite,
  cancelChildSetupInvite,
  inviteChildSetupByLink,
} from "../../services/parents";

import DashboardHeader from "../../components/ui/DashboardHeader";

import "../../css/onboarding/WaitingForChild.css";

export default function WaitingForChild() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function showFeedback(title, message) {
    setFeedback({ title, message });

    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  async function handleResendInvitation() {
    const draftId = sessionStorage.getItem("childSetupDraftId");

    try {
      if (draftId) {
        await resendChildSetupInvite(draftId);
      }

      showFeedback(
        "Invitation resent",
        `A new invitation was sent to ${child.email}.`
      );
    } catch (err) {
      showFeedback(
        "Couldn't resend invitation",
        err?.message || "Please try again in a moment."
      );
    }
  }

  async function handleCopyLink() {
    const draftId = sessionStorage.getItem("childSetupDraftId");
    let link = `https://focuslens.app/invite/${encodeURIComponent(
      child.preferredName || "demo"
    )}`;

    if (draftId) {
      try {
        const data = await inviteChildSetupByLink(draftId);
        const realLink =
          data?.invitationUrl ?? data?.link ?? data?.url ?? data?.inviteLink;
        if (realLink) link = realLink;
      } catch (err) {
        console.error("Failed to create child setup link:", err);
      }
    }

    navigator.clipboard?.writeText(link).catch(() => {});

    showFeedback(
      "Invitation link copied",
      `Share it privately with ${child.preferredName}.`
    );
  }

  async function handleCancelInvitation() {
    const draftId = sessionStorage.getItem("childSetupDraftId");

    try {
      if (draftId) {
        await cancelChildSetupInvite(draftId);
      }
    } catch (err) {
      console.error("Failed to cancel child setup invite:", err);
    }

    sessionStorage.removeItem("childSetupDraftId");
    setUser((current) => (current ? { ...current, hasChild: false } : current));
    setShowCancelModal(false);
    navigate("/overview");
  }

  return (
    <div className="waiting-page-shell">
      {/* Dashboard Header */}
      <DashboardHeader />

      <ParentLayout>
        <main className="waiting-content">
          {/* Feedback */}
          {feedback && (
            <div className="waiting-feedback">
              <div className="feedback-icon">
                <Check size={17} strokeWidth={2.5} />
              </div>

              <div className="feedback-text">
                <b>{feedback.title}</b>
                <p>{feedback.message}</p>
              </div>

              <button
                type="button"
                className="feedback-close"
                onClick={() => setFeedback(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Page heading */}
          <section className="waiting-heading">
            <h1>Waiting for {child.preferredName} to join</h1>

            <p>
              Study progress will appear after {child.preferredName} activates
              FocusLens and chooses what to share.
            </p>
          </section>

          {/* Invitation Card */}
          <section className="waiting-card invitation-card">
            <div className="invitation-status">
              <span className="status-icon">
                <Clock3 size={19} strokeWidth={1.9} />
              </span>

              <h2>Invitation pending</h2>
            </div>

            <div className="invitation-info">
              <span>
                {child.preferredName} · {child.grade}
              </span>

              <span className="info-dot">•</span>

              <span>Email: {child.email}</span>
            </div>

            <p className="invitation-expiry">
              Expires in {child.invitationExpiresIn} · Activation and sharing
              approval are still needed.
            </p>

            <div className="waiting-actions">
              <Button onClick={handleResendInvitation}>
                Resend invitation
              </Button>

              <Button secondary onClick={handleCopyLink}>
                Copy link
              </Button>
            </div>
          </section>

          {/* Setup Checklist */}
          <section className="waiting-card setup-card">
            <h2>Setup checklist</h2>

            <p className="setup-description">
              Profile ready, {child.preferredName} can review and adjust the
              setup.
            </p>

            <div className="setup-actions">
              <Button
                onClick={() =>
                  navigate("/setup/review?returnTo=waiting")
                }
              >
                Edit child information
              </Button>

              <button
                className="cancel-invitation"
                onClick={() => setShowCancelModal(true)}
                type="button"
              >
                Cancel invitation
              </button>
            </div>
          </section>
        </main>
      </ParentLayout>

      {/* Cancel Invitation Modal */}
      {showCancelModal && (
        <div className="confirm-overlay">
          <section className="confirm-modal">
            <div className="confirm-icon">
              <CircleAlert size={24} strokeWidth={1.8} />
            </div>

            <h2>
              Cancel {child.preferredName}’s invitation?
            </h2>

            <p>
              The invitation link will stop working. Your child&apos;s draft
              profile stays saved, so you can invite them again later.
            </p>

            <button
              className="confirm-decline-link"
              onClick={handleCancelInvitation}
              type="button"
            >
              Cancel invitation
            </button>

            <button
              className="confirm-cancel-button"
              onClick={() => setShowCancelModal(false)}
              type="button"
            >
              Keep invitation
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
