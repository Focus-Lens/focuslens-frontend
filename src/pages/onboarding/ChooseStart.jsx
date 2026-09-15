import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";
import { Users, UserRoundPlus, Check } from "lucide-react";
import "../../css/onboarding/ChooseStart.css";

export default function ChooseStart() {
  const [choice, setChoice] = useState("connect");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  function handleDoThisLater() {
    setUser((current) => (current ? { ...current, hasChild: false } : current));
    navigate("/overview");
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
              <Button
                to={
                  choice === "setup"
                    ? "/profile-setup-choice"
                    : "/review-invitation"
                }
              >
                Continue
              </Button>

              <button
                type="button"
                className="choose-start-later"
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
