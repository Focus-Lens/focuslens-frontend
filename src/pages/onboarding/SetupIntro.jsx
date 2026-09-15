import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { Clock3 } from "lucide-react";
import "../../css/onboarding/SetupIntro.css";

export default function SetupIntro() {
  return (
    <AuthLayout hideFooter>
      <div className="setup-intro-wrapper">
        <Card>
          <div className="setup-intro-page">

            {/* Logo */}
            <div className="setup-intro-logo">
              <img
                src="/images/Focuslens logo animation - success 2.png"
                alt="FocusLens"
              />
            </div>

            {/* Time / steps badge */}
            <div className="setup-intro-badge">
              <Clock3 size={19} strokeWidth={2} />
              <span>About 5 minutes · 6 short steps</span>
            </div>

            {/* Title */}
            <h1 className="setup-intro-title">
              Let’s set up FocusLens for your child
            </h1>

            {/* Subtitle */}
            <p className="setup-intro-subtitle">
              We’ll start with a few details, then you can send a private
              invitation to their phone or tablet.
            </p>

            {/* Steps */}
            <p className="setup-intro-steps">
              Basic information&nbsp; → &nbsp;Studies&nbsp; → &nbsp;Study context
              &nbsp; → &nbsp;Goal&nbsp; → &nbsp;Review&nbsp; → &nbsp;Invite
            </p>

            {/* Actions */}
            <div className="setup-intro-actions">
              <Button to="/setup/basic-info">
                Start setup
              </Button>

              <Button secondary to="/overview">
                Do this later
              </Button>
            </div>

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}