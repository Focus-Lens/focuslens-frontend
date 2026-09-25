import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";
import { markSetupDeferred } from "../../services/setupDeferral";
import "../../css/auth/AccountCreated.css"
export default function AccountCreated() {
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleContinue() {
    // ChooseStart enables the invitation path when an invitation is present,
    // otherwise it enables the new child setup path and disables the other.
    navigate("/choose-start");
  }

  function handleDoThisLater() {
    markSetupDeferred(user);
    navigate("/overview", { replace: true });
  }

  return (
    <AuthLayout hideFooter headerVariant="onboarding">
  <div className="account-created-wrapper">
    <Card>
      <div className="account-created-page">

        <div className="account-created-logo">
          <img
            src="/images/Focuslens logo animation - success 2.png"
            alt="FocusLens"
          />
        </div>

        <h1 className="account-created-title">
          Your parent account has been created
        </h1>

        <p className="account-created-subtitle">
          Now choose how you’d like to connect with your child.
        </p>

        <div className="account-created-actions">
          <Button onClick={handleContinue}>
            Continue
          </Button>

          <Button
            secondary
            onClick={handleDoThisLater}
          >
            Do this later
          </Button>
        </div>
      </div>
    </Card>
  </div>
</AuthLayout>
  );
}
