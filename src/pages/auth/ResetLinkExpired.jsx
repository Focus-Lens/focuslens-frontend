import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import "../../css/auth/ResetLinkExpired.css";

export default function ResetLinkExpired() {
  return (
    <AuthLayout hideFooter>
      <div className="reset-link-expired-wrapper">
        <Card>
          <div className="reset-link-expired-page">

            <h1 className="reset-link-expired-title">
              This reset link is no longer valid
            </h1>

            <p className="reset-link-expired-subtitle">
              It may have expired or already been used.
              <br />
              Request a new link to safely reset your password.
            </p>

            <div className="reset-link-expired-actions">
              <Button to="/forgot-password">
                Request a new reset link
              </Button>

              <Button
                secondary
                to="/sign-in"
              >
                Back to sign in
              </Button>
            </div>

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}