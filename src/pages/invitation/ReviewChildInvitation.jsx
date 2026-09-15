import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import DeclineInvitationModal from "../../components/ui/DeclineInvitationModal";
import { child as mockChild, invitation as mockInvitation } from "../../data/mockData";
import {
  acceptParentInvitation,
  declineParentInvitation,
} from "../../services/access";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/apiClient";
import {
  UserRoundPlus,
  Check,
  Info,
} from "lucide-react";
import "../../css/invitation/ReviewChildInvitation.css";

export default function ReviewChildInvitation() {
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const [showDecline, setShowDecline] = useState(false);
  const [error, setError] = useState("");

  const previewRaw = sessionStorage.getItem("pendingInvitationPreview");
  const preview = previewRaw ? JSON.parse(previewRaw) : null;
  const childName = preview?.studentPreferredName ?? mockChild.preferredName;
  const sharedItems = mockInvitation.sharedItems;

  async function handleConfirmConnection() {
    const token = sessionStorage.getItem("pendingInvitationToken");
    setError("");

    try {
      if (!token) throw new Error("The invitation token is missing.");
      await acceptParentInvitation(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err.message);
      return;
    }

    sessionStorage.removeItem("pendingInvitationToken");
    sessionStorage.removeItem("pendingInvitationPreview");
    setUser((current) => (current ? { ...current, hasChild: true } : current));
    refreshUser();
    navigate("/overview");
  }

  async function handleDecline() {
    const token = sessionStorage.getItem("pendingInvitationToken");
    setError("");

    try {
      if (!token) throw new Error("The invitation token is missing.");
      await declineParentInvitation(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err.message);
      setShowDecline(false);
      return;
    }

    sessionStorage.removeItem("pendingInvitationToken");
    sessionStorage.removeItem("pendingInvitationPreview");
    setUser((current) => (current ? { ...current, hasChild: false } : current));
    navigate("/overview");
  }

  return (
    <AuthLayout hideFooter>
      <div className="review-invitation-wrapper">
        <Card>
          <div className="review-invitation-page">

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
                <small>
                  Age range 13–15 · Preferred name only
                </small>
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

            <div className="review-invitation-actions">
              {error && <p className="password-error">{error}</p>}
              <Button onClick={handleConfirmConnection}>
                Confirm connection
              </Button>

              <button
                type="button"
                className="review-invitation-decline"
                onClick={() => setShowDecline(true)}
              >
                Decline invitation
              </button>
            </div>

          </div>
        </Card>
      </div>

      {showDecline && (
        <DeclineInvitationModal
          childName={childName}
          onCancel={() => setShowDecline(false)}
          onConfirm={handleDecline}
        />
      )}
    </AuthLayout>
  );
}
