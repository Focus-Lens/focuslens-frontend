import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { useChildProfile } from "../../context/ChildProfileContext";
import { clearChildInvitationDraft } from "../../services/childInvitationDraft";
import { Users, UserRoundPlus, Check } from "lucide-react";
import "../../css/onboarding/ChooseStart.css";

export default function ChooseStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetChild } = useChildProfile();

  const hasInvitation = Boolean(
    sessionStorage.getItem("pendingInvitationToken"),
  );

  const [choice, setChoice] = useState(hasInvitation ? "connect" : "setup");
  const [error, setError] = useState(
    () => location.state?.invitationError || "",
  );
  const [submitting, setSubmitting] = useState(false);

  function handleDoThisLater() {
    navigate("/overview");
  }

  async function handleContinue() {
    if (hasInvitation) {
      if (choice !== "connect") return;

      setError("");
      navigate("/review-invitation");
      return;
    }

    if (choice !== "setup") return;

    try {
      setSubmitting(true);
      setError("");

      resetChild();
      clearChildInvitationDraft();

      ["childSetupDraftId", "childSetupInvitation"].forEach((key) => {
        sessionStorage.removeItem(key);
      });

      const draft = await api("/api/parents/child-setups", {
        method: "POST",
      });

      sessionStorage.setItem("childSetupDraftId", draft.id);
      navigate("/profile-setup-choice");
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <div className="choose-start-wrapper">
        <Card>
          <div className="choose-start-page">
            <h1 className="choose-start-title">
              How would you like to begin?
            </h1>

            <p className="choose-start-subtitle">
              Choose the option that matches your family.
            </p>

            <button
              type="button"
              className={`choose-start-option ${
                choice === "connect" ? "selected" : ""
              }`}
              disabled={!hasInvitation}
              aria-disabled={!hasInvitation}
              onClick={() => {
                if (!hasInvitation) return;
                setChoice("connect");
                setError("");
              }}
            >
              <span className="choose-start-icon">
                <Users size={23} strokeWidth={2} />
              </span>

              <span className="choose-start-option-text">
                <b>My child already uses FocusLens</b>
                <small>
                  Continue with the invitation already attached to your link.
                </small>
              </span>

              {choice === "connect" && (
                <span className="choose-start-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            <button
              type="button"
              className={`choose-start-option ${
                choice === "setup" ? "selected" : ""
              }`}
              disabled={hasInvitation}
              aria-disabled={hasInvitation}
              onClick={() => {
                if (hasInvitation) return;
                setChoice("setup");
                setError("");
              }}
            >
              <span className="choose-start-icon">
                <UserRoundPlus size={22} strokeWidth={1.8} />
              </span>

              <span className="choose-start-option-text">
                <b>Set up FocusLens for my child</b>
                <small>
                  Create their study profile, then invite them to the mobile app.
                </small>
              </span>

              {choice === "setup" && (
                <span className="choose-start-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            <div className="choose-start-actions">
              <Button onClick={handleContinue} disabled={submitting}>
                {submitting ? "Creating..." : "Continue"}
              </Button>

              <button
                type="button"
                className="choose-start-later"
                onClick={handleDoThisLater}
              >
                I’ll do this later
              </button>
            </div>

            {error && (
              <p className="choose-start-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
