import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";
import { useChildProfile } from "../../context/ChildProfileContext";
import { api } from "../../services/api";
import {
  getChildSetupValidationMessage,
  saveProfileSetupModeAndContinue,
} from "../../services/childSetupFlow";
import { markSetupDeferred } from "../../services/setupDeferral";
import { UserRoundPlus, Share2, Check } from "lucide-react";
import "../../css/onboarding/ProfileSetupChoice.css";

export default function ProfileSetupChoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { child, updateChild } = useChildProfile();
  const [choice, setChoice] = useState(child.profileSetupMode || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (isSaving || !choice) return;

    const draftId = sessionStorage.getItem("childSetupDraftId");
    setIsSaving(true);
    setError("");
    try {
      await saveProfileSetupModeAndContinue({
        draftId,
        profileSetupMode: choice,
        request: api,
        onSaved: (profileSetupMode) => updateChild({ profileSetupMode }),
        navigate,
        nextPath: choice === "ParentManaged" ? "/setup-intro" : "/setup/send-link",
      });
    } catch (requestError) {
      setError(
        getChildSetupValidationMessage(requestError) ||
          requestError.message ||
          "Could not save this setup choice. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleDoThisLater() {
    markSetupDeferred(user);
    navigate("/overview");
  }

  return (
    <AuthLayout hideFooter headerVariant="onboarding">
      <div className="profile-setup-wrapper">
        <Card>
          <div className="profile-setup-page">

            <h1 className="profile-setup-title">
              How will the profile be set up?
            </h1>

            <p className="profile-setup-subtitle">
              Choose whether you or your child will create it.
            </p>

            {/* Parent setup */}
            <button
              type="button"
              className={`profile-setup-option ${
                choice === "ParentManaged" ? "selected" : ""
              }`}
              onClick={() => { setChoice("ParentManaged"); setError(""); }}
            >
              <span className="profile-setup-icon">
                <UserRoundPlus size={23} strokeWidth={2} />
              </span>

              <span className="profile-setup-option-text">
                <b>I’ll set up my child’s profile</b>
                <small>
                  Enter their study details, then invite them to the app.
                </small>
              </span>

              {choice === "ParentManaged" && (
                <span className="profile-setup-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            {/* Setup link */}
            <button
              type="button"
              className={`profile-setup-option ${
                choice === "ChildManaged" ? "selected" : ""
              }`}
              onClick={() => { setChoice("ChildManaged"); setError(""); }}
            >
              <span className="profile-setup-icon">
                <Share2 size={22} strokeWidth={2} />
              </span>

              <span className="profile-setup-option-text">
                <b>The child will set up their own profile</b>
                <small>
                  Send a secure setup link so your child can create their own profile.
                </small>
              </span>

              {choice === "ChildManaged" && (
                <span className="profile-setup-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            {/* Continue */}
            <div className="profile-setup-actions">
              <Button
                onClick={handleContinue}
                disabled={!choice || isSaving}
              >
                {isSaving ? "Saving..." : "Continue"}
              </Button>

              <button
                type="button"
                className="profile-setup-later"
                onClick={handleDoThisLater}
              >
                I’ll do this later
              </button>
            </div>

            {error && <p className="profile-setup-error" role="alert">{error}</p>}

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
