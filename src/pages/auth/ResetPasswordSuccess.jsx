import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import "../../css/auth/ResetPasswordSuccess.css";

export default function ResetPasswordSuccess() {
  return (
    <AuthLayout hideFooter>
      <div className="reset-password-success-wrapper">
        <Card>
          <div className="reset-password-success-page">

            <div className="reset-password-success-logo">
              <img
                src="/public/images/Focuslens logo animation - success 2.png"
                alt="FocusLens"
              />
            </div>

            <h1 className="reset-password-success-title">
              Your password has been reset
            </h1>

            <p className="reset-password-success-subtitle">
              Sign in with your new password to continue.
              <br />
              Your child invitation is still waiting for you.
            </p>

            <div className="reset-password-success-actions">
              <Button to="/sign-in">
                Back to sign in
              </Button>
            </div>

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}