import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";
import { UserRoundPlus, Share2, Check } from "lucide-react";
import "../../css/onboarding/ProfileSetupChoice.css";

export default function ProfileSetupChoice() {
  const [choice, setChoice] = useState("parent");
  const navigate = useNavigate();

  function handleDoThisLater() {
    parent.hasChild = false;
    navigate("/overview");
  }

  return (
    <AuthLayout hideFooter>
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
                choice === "parent" ? "selected" : ""
              }`}
              onClick={() => setChoice("parent")}
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

              {choice === "parent" && (
                <span className="profile-setup-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            {/* Setup link */}
            <button
              type="button"
              className={`profile-setup-option ${
                choice === "link" ? "selected" : ""
              }`}
              onClick={() => setChoice("link")}
            >
              <span className="profile-setup-icon">
                <Share2 size={22} strokeWidth={2} />
              </span>

              <span className="profile-setup-option-text">
                <b>Send my child a setup link</b>
                <small>
                  Send a secure profile link with your invitation attached.
                </small>
              </span>

              {choice === "link" && (
                <span className="profile-setup-check">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
            </button>

            {/* Continue */}
            <div className="profile-setup-actions">
              <Button
                onClick={() => navigate(choice === "link" ? "/setup/send-link" : "/setup-intro")}
              >
                Continue
              </Button>

              <button
                type="button"
                className="profile-setup-later"
                onClick={handleDoThisLater}
              >
                I’ll do this later
              </button>
            </div>

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
