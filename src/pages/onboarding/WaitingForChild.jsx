import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Check, Clock3, Link2, Mail } from "lucide-react";

import { ParentLayout, Button } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";

import DashboardHeader from "../../components/ui/DashboardHeader";
import { useChildProfile } from "../../context/useChildProfile";
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
import { copyText } from "../../services/clipboard";
import useTabReturnRefresh from "../../services/useTabReturnRefresh";

function formatExpiresIn(expiresAtUtc) {
  const expiresAt = expiresAtUtc ? new Date(expiresAtUtc).getTime() : NaN;
  if (Number.isNaN(expiresAt)) return null;

  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return "Expired";

  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  if (days > 1) return `Expires in ${days} days`;

  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  return hours > 1 ? `Expires in ${hours} hours` : "Expires in less than an hour";
}

export default function WaitingForChild({
  childName,
  pendingChild,
  initialInvitation = null,
  onInvitationCancelled,
}) {
  const navigate = useNavigate();
  const { child, resetChild } = useChildProfile();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [justCopiedLink, setJustCopiedLink] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  // Provided by the Overview, which loads it together with the children list,
  // so the email and expiry show immediately.
  const [serverInvitation, setServerInvitation] = useState(initialInvitation);

  const knownName =
    serverInvitation?.firstName || pendingChild?.firstName || childName || child.preferredName;
  // A setup the child completes themselves has no name until they do.
  const isChildManaged = !knownName;
  const displayedName = knownName || "your child";
  const displayedGrade = serverInvitation?.grade
    ? serverInvitation.grade.replace(/(\D)(\d)/, "$1 $2")
    : child.grade === "Other"
      ? child.otherGrade || "Other"
      : child.grade;
  const customSubjects = child.otherSubjects?.length
    ? child.otherSubjects
    : child.otherSubject?.trim()
      ? [child.otherSubject.trim()]
      : [];
  const displayedSubjects = (child.subjects || [])
    .flatMap((subject) => subject === "Other" ? customSubjects : [subject])
    .filter(Boolean);
  const invitation = serverInvitation || pendingChild;
  // Link invitations can only be copied again and email invitations can only
  // be resent; the backend rejects the other action for each type.
  const isLinkInvitation = invitation?.type === "Link";
  const isEmailInvitation = invitation?.type === "Email";
  const expiryText = formatExpiresIn(invitation?.expiresAtUtc);
  const invitedEmail = isEmailInvitation
    ? (invitation?.targetEmail || invitation?.email || child.email || "").toLowerCase()
    : "";
  const childDetails = isChildManaged ? [] : [
    ["Name", [displayedName, child.lastName].filter(Boolean).join(" ")],
    ["Date of birth", child.dateOfBirth],
    ["Grade", displayedGrade],
    ["Subjects", displayedSubjects.join(", ")],
    ["Study priorities", child.studyPriorities?.join(" · ")],
    ["Suggested goal", child.suggestedGoal || (child.studyTimeGoal?.value
      ? `${child.studyTimeGoal.value} hours per week`
      : "")],
  ].filter(([, value]) => value);

  const tabReturnCount = useTabReturnRefresh();

  useEffect(() => {
    if (tabReturnCount === 0 && initialInvitation) return undefined;
    let active = true;

    api("/api/parents/child-setups/invitations")
      .then((invitations) => {
        if (!active) return;
        const nextInvitation = invitations[0] || null;
        setServerInvitation(nextInvitation);
        // Opened on its own route and the invitation is gone (cancelled or
        // accepted elsewhere): there is nothing left to wait for. Inside the
        // Overview, the Overview reloads and decides what to show.
        if (!nextInvitation && tabReturnCount > 0 && !onInvitationCancelled) {
          navigate("/overview", { replace: true });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
    // Reloads on mount and whenever the parent returns to this tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabReturnCount]);

  function showFeedback(title, message, type = "success") {
    setFeedback({ title, message, type });

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
        invitation?.targetEmail || invitation?.email || child.email
          ? `A new invitation was sent to ${(invitation?.targetEmail || invitation?.email || child.email).toLowerCase()}.`
          : `A new invitation was sent to ${displayedName}.`,
      );
    } catch (error) {
      showFeedback(
        "We couldn't resend the invitation",
        error.message || "Please try again in a moment.",
        "error",
      );
    } finally {
      setIsResending(false);
    }
  }

  // The invitations list does not include the link, so the backend issues a
  // fresh one for the pending invitation (the previous link stops working).
  async function handleCopyLink() {
    if (isCopyingLink) return;

    try {
      setIsCopyingLink(true);
      let invitation = serverInvitation || pendingChild;
      let draftId =
        invitation?.draftId ||
        invitation?.childSetupDraftId ||
        getChildInvitationDraft().draftId ||
        getChildInvitationDraft().childSetupDraftId;

      if (!draftId) {
        const invitations = await api("/api/parents/child-setups/invitations");
        invitation = invitations[0];
        draftId = invitation?.draftId || invitation?.childSetupDraftId;
        if (invitation) setServerInvitation(invitation);
      }

      if (!draftId) {
        throw new Error("No pending invitation was found.");
      }

      const response = await api(
        `/api/parents/child-setups/${encodeURIComponent(draftId)}/invite/link`,
        { method: "POST" },
      );
      const link = response?.invitationUrl;
      if (!link) throw new Error("The server did not return an invitation link.");

      sessionStorage.setItem("childSetupInvitation", JSON.stringify(response));
      if (response.expiresAtUtc) {
        setServerInvitation((current) =>
          current ? { ...current, expiresAtUtc: response.expiresAtUtc } : current,
        );
      }
      await copyText(link);
      setJustCopiedLink(true);
      window.setTimeout(() => setJustCopiedLink(false), 2500);

      showFeedback(
        "Invitation link copied",
        `Share it privately with ${displayedName}.`
      );
    } catch (error) {
      showFeedback(
        "We couldn't copy the invitation link",
        error.message || "Please try again in a moment.",
        "error",
      );
    } finally {
      setIsCopyingLink(false);
    }
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
            <div
              className={`waiting-feedback ${feedback.type === "error" ? "error" : ""}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              <div className="feedback-icon">
                {feedback.type === "error"
                  ? <CircleAlert size={18} strokeWidth={2.5} />
                  : <Check size={17} strokeWidth={2.5} />}
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

          <div className="waiting-layout">
            {/* Invitation Card */}
            <section className="waiting-card invitation-card">
              <div className="invitation-card-top">
                <div className="invitation-status">
                  <span className="status-icon">
                    <Clock3 size={17} strokeWidth={2} />
                  </span>

                  <h2>Invitation pending</h2>
                </div>

                {expiryText && <span className="invitation-expiry-badge">{expiryText}</span>}
              </div>

              <p className="invitation-summary">
                {isChildManaged
                  ? "Your child will create their own profile when they open the invitation."
                  : `${displayedName}${displayedGrade ? ` · ${displayedGrade}` : ""}`}
              </p>

              {(isEmailInvitation || isLinkInvitation) && (
                <div className="invitation-delivery">
                  <span className="invitation-delivery-icon">
                    {isEmailInvitation
                      ? <Mail size={17} strokeWidth={2} />
                      : <Link2 size={17} strokeWidth={2} />}
                  </span>
                  <div>
                    <span className="invitation-delivery-label">
                      {isEmailInvitation ? "Sent by email to" : "Shared as"}
                    </span>
                    <b>{isEmailInvitation ? invitedEmail || "your child’s email" : "A private invitation link"}</b>
                  </div>
                </div>
              )}

              {childDetails.length > 0 && (
                <dl className="waiting-child-details">
                  {childDetails.map(([label, value]) => (
                    <div className="waiting-child-detail" key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="waiting-actions">
                {!isLinkInvitation && (
                  <Button onClick={handleResendInvitation} disabled={isResending}>
                    {isResending ? "Resending..." : "Resend invitation"}
                  </Button>
                )}

                {!isEmailInvitation && (
                  <Button
                    secondary={!isLinkInvitation}
                    onClick={handleCopyLink}
                    disabled={isCopyingLink}
                  >
                    {isCopyingLink
                      ? "Copying..."
                      : justCopiedLink
                        ? "Link copied ✓"
                        : "Copy link"}
                  </Button>
                )}

                {!isChildManaged && (
                  <button
                    className="waiting-edit-link"
                    onClick={() => navigate("/setup/review?returnTo=waiting")}
                    type="button"
                  >
                    Edit child information
                  </button>
                )}

                <button
                  className="cancel-invitation"
                  onClick={() => setShowCancelModal(true)}
                  type="button"
                >
                  Cancel invitation
                </button>
              </div>
            </section>
          </div>
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
