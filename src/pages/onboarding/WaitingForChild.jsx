import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Check, Clock3 } from "lucide-react";

import { ParentLayout, Button } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";

import DashboardHeader from "../../components/ui/DashboardHeader";
import { useChildProfile } from "../../context/ChildProfileContext";
import {
  clearPendingInvitation,
} from "../../services/pendingInvitationCache";
import { cacheParentChildren, getCachedParentChildren } from "../../services/parentChildrenCache";
import {
  clearChildInvitationDraft,
  getChildInvitationDraft,
} from "../../services/childInvitationDraft";
import { api } from "../../services/api";

import "../../css/onboarding/WaitingForChild.css";

export default function WaitingForChild({
  childName,
  childEmail,
  pendingChild,
  onInvitationCancelled,
}) {
  const navigate = useNavigate();
  const { child, resetChild } = useChildProfile();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [serverInvitation, setServerInvitation] = useState(null);

  const displayedName =
    serverInvitation?.firstName || pendingChild?.firstName || childName || child.preferredName || "your child";
  const displayedEmail =
    serverInvitation?.targetEmail ||
    pendingChild?.email ||
    childEmail ||
    getChildInvitationDraft().email ||
    child.email;
  const displayedGrade = serverInvitation?.grade
    ? serverInvitation.grade.replace(/(\D)(\d)/, "$1 $2")
    : child.grade;

  useEffect(() => {
    let active = true;

    api("/api/parents/child-setups/invitations")
      .then((invitations) => {
        if (active) setServerInvitation(invitations[0] || null);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  function showFeedback(title, message) {
    setFeedback({ title, message });

    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  }

  async function handleResendInvitation() {
    if (isResending) return;

    try {
      let invitation = serverInvitation || pendingChild;
      let draftId =
        invitation?.draftId ||
        invitation?.childSetupDraftId ||
        getChildInvitationDraft().draftId ||
        getChildInvitationDraft().childSetupDraftId;

      // Refresh from the server if this page was opened directly or after a reload.
      if (!draftId) {
        const invitations = await api("/api/parents/child-setups/invitations");
        invitation = invitations[0];
        draftId = invitation?.draftId || invitation?.childSetupDraftId;
        if (invitation) setServerInvitation(invitation);
      }

      if (!draftId) {
        throw new Error("No pending invitation was found to resend.");
      }

      setIsResending(true);
      await api(`/api/parents/child-setups/${draftId}/invite/resend`, {
        method: "POST",
      });
      showFeedback(
        "Invitation resent",
        `A new invitation was sent to ${displayedEmail}.`,
      );
    } catch (error) {
      showFeedback(
        "We couldn't resend the invitation",
        error.message || "Please try again in a moment.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleCopyLink() {
    const link = `https://focuslens.app/invite/${encodeURIComponent(
      displayedName || "demo"
    )}`;

    navigator.clipboard?.writeText(link).catch(() => {});

    showFeedback(
      "Invitation link copied",
      `Share it privately with ${displayedName}.`
    );
  }

  async function handleCancelInvitation() {
    if (isCancelling) return;

    let invitation = serverInvitation || pendingChild;
    let draftId =
      invitation?.draftId || invitation?.childSetupDraftId || invitation?.id;
    setCancelError("");

    try {
      if (!draftId) {
        const children = await api("/api/parents/overview/children");
        invitation = children.find(
          (item) =>
            !item.studentId &&
            item.type === "ChildSetup" &&
            item.childSetupInvitationStatus === "Pending",
        );
        draftId =
          invitation?.draftId || invitation?.childSetupDraftId || invitation?.id;
      }

      if (!draftId) {
        throw new Error("No active invitation was found for this account.");
      }

      setIsCancelling(true);
      await api(`/api/parents/child-setups/${draftId}/invite/cancel`, {
        method: "POST",
      });
      parent.hasChild = false;
      const cancelledId = invitation?.draftId || invitation?.childSetupDraftId || draftId;
      cacheParentChildren((getCachedParentChildren() || []).filter((item) =>
        (item.childSetupDraftId || item.id) !== cancelledId,
      ));
      clearPendingInvitation();
      clearChildInvitationDraft();
      resetChild();
      ["childSetupDraftId", "childSetupInvitation"].forEach((key) =>
        sessionStorage.removeItem(key),
      );
      setShowCancelModal(false);
      onInvitationCancelled?.(invitation);
      navigate("/overview", { replace: true });
    } catch (error) {
      setCancelError(error.message || "Please try again in a moment.");
    } finally {
      setIsCancelling(false);
    }
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
            <h1>Waiting for {displayedName} to join</h1>

            <p>
              Study progress will appear after {displayedName} activates
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
                {displayedName} · {displayedGrade}
              </span>

              <span className="info-dot">•</span>

              <span>Email: {displayedEmail}</span>
            </div>

            <p className="invitation-expiry">
              Expires in {child.invitationExpiresIn} · Activation and sharing
              approval are still needed.
            </p>

            <div className="waiting-actions">
              <Button onClick={handleResendInvitation} disabled={isResending}>
                {isResending ? "Resending..." : "Resend invitation"}
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
              Profile ready, {displayedName} can review and adjust the
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
              Cancel {displayedName}’s invitation?
            </h2>

            <p>
              The invitation link will stop working. Your child&apos;s draft
              profile stays saved, so you can invite them again later.
            </p>

            {cancelError && (
              <p className="confirm-error" role="alert">
                {cancelError}
              </p>
            )}

            <button
              className="confirm-decline-link"
              onClick={handleCancelInvitation}
              type="button"
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel invitation"}
            </button>

            <button
              className="confirm-cancel-button"
              onClick={() => setShowCancelModal(false)}
              type="button"
              disabled={isCancelling}
            >
              Keep invitation
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
