import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import DeclineInvitationModal from "../../components/ui/DeclineInvitationModal";
import {
  acceptAccessInvitation,
  clearAccessInvitation,
  declineAccessInvitation,
  getAccessInvitationId,
  resolveAccessInvitation,
} from "../../services/api";
import {
  UserRoundPlus,
  Check,
  Info,
} from "lucide-react";
import "../../css/invitation/ReviewChildInvitation.css";

export default function ReviewChildInvitation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDecline, setShowDecline] = useState(false);
  const [invitation, setInvitation] = useState(() => location.state?.invitation || null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const token = sessionStorage.getItem("pendingInvitationToken");

  useEffect(() => {
    if (invitation) return;
    if (!token) {
      clearAccessInvitation();
      navigate("/choose-start", {
        replace: true,
        state: { invitationError: "Open the invitation link sent to your email. This invitation link is missing or expired." },
      });
      return;
    }
    resolveAccessInvitation(token)
      .then(setInvitation)
      .catch(() => {
        clearAccessInvitation();
        navigate("/choose-start", {
          replace: true,
          state: { invitationError: "This invitation link is invalid or has expired. Please open the latest invitation email." },
        });
      });
  }, [invitation, navigate, token]);

  const childName = invitation?.studentPreferredName || sessionStorage.getItem("pendingInvitationName") || "your child";
  const ageRange = invitation?.studentAgeRange ?? invitation?.ageRange;
  const childDetails = [
    typeof ageRange === "string" || typeof ageRange === "number"
      ? `Age range ${ageRange}`
      : null,
    "Preferred name only",
  ].filter(Boolean).join(" · ");
  const sharedItems = ["Study schedule", "Goals & routines", "Focus-session summaries"];

  async function handleConfirmConnection() {
    try {
      setSubmitting(true);
      setError("");
      const invitationId = getAccessInvitationId(invitation);
      if (!invitationId) throw new Error("This invitation could not be identified. Please reopen the invitation link.");
      await acceptAccessInvitation(invitationId);
      clearAccessInvitation();
      navigate("/overview");
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  async function handleDecline() {
    try {
      setSubmitting(true);
      setError("");
      const invitationId = getAccessInvitationId(invitation);
      if (!invitationId) throw new Error("This invitation could not be identified. Please reopen the invitation link.");
      await declineAccessInvitation(invitationId);
      clearAccessInvitation();
      navigate("/overview");
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  return (
    <AuthLayout hideFooter>
      <div className="review-invitation-wrapper">
        <Card>
          <div className="review-invitation-page">

            {!invitation ? (error ? <p className="password-error">{error}</p> : <p>Loading invitation…</p>) : <>
            <div className="review-invitation-icon">
              <UserRoundPlus size={27} strokeWidth={1.6} />
            </div>

            <h1 className="review-invitation-title">
              Review {childName}’s invitation
            </h1>

            <p className="review-invitation-subtitle">
              Confirm the relationship before any study information is shared.
            </p>

            <div className="review-invitation-identity">
              <span className="review-invitation-avatar">
                {childName[0]}
              </span>

              <div className="review-invitation-identity-text">
                <b>{childName}</b>
                <small>{childDetails}</small>
              </div>
            </div>

            <h3 className="review-invitation-sharing-title">
              Information currently offered for sharing
            </h3>

            <div className="review-invitation-chips">
              {sharedItems.map((item) => (
                <span key={item}>
                  <Check size={14} strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>

            <div className="review-invitation-info">
              <span className="review-invitation-info-icon">
                <Info size={15} strokeWidth={2.5} />
              </span>

              <span>
                No private study metrics are visible yet.
              </span>
            </div>

            {error && !showDecline && <p className="password-error">{error}</p>}

            <div className="review-invitation-actions">
              <Button onClick={handleConfirmConnection} disabled={submitting}>
                {submitting ? "Updating…" : "Confirm connection"}
              </Button>

              <button
                type="button"
                className="review-invitation-decline"
                disabled={submitting}
                onClick={() => {
                  setError("");
                  setShowDecline(true);
                }}
              >
                Decline invitation
              </button>
            </div></>}

          </div>
        </Card>
      </div>

      {showDecline && (
        <DeclineInvitationModal
          childName={childName}
          error={error}
          submitting={submitting}
          onCancel={() => setShowDecline(false)}
          onConfirm={handleDecline}
        />
      )}
    </AuthLayout>
  );
}
