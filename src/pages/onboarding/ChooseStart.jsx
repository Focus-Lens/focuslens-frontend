import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { Users, UserRoundPlus, Check } from "lucide-react";
import "../../css/onboarding/ChooseStart.css";

export default function ChooseStart() {
  const [choice, setChoice] = useState("connect");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleDoThisLater() {
    navigate("/overview");
  }

  async function handleContinue() {
    if (choice === "connect") {
      // A review can only be shown when the parent arrived through a real
      // child invitation link, which stores its token for this session.
      navigate(sessionStorage.getItem("pendingInvitationToken") ? "/review-invitation" : "/connect-child");
      return;
    }
    try {
      setSubmitting(true); setError("");
      const draft = await api("/api/parents/child-setups", { method: "POST" });
      sessionStorage.setItem("childSetupDraftId", draft.id);
      navigate("/profile-setup-choice");
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
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

            {/* Connect existing child */}
            <button
              type="button"
              className={`choose-start-option ${
                choice === "connect" ? "selected" : ""
              }`}
              onClick={() => setChoice("connect")}
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

            {/* Setup child */}
            <button
              type="button"
              className={`choose-start-option ${
                choice === "setup" ? "selected" : ""
              }`}
              onClick={() => setChoice("setup")}
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

            {/* Continue */}
            <div className="choose-start-actions">
              <Button onClick={handleContinue} disabled={submitting}>{submitting ? "Creating..." : "Continue"}</Button>

              <button
                type="button"
                className="choose-start-later"
                onClick={handleDoThisLater}
              >
                I’ll do this later
              </button>
            </div>
            {error && <p className="password-error">{error}</p>}

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
