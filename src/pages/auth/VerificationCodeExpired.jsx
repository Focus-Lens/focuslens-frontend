import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import "../../css/auth/ResetLinkExpired.css";

export default function VerificationCodeExpired() {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  async function requestNewCode() {
    const email = sessionStorage.getItem("pendingParentEmail");
    if (!email) {
      navigate("/register", { replace: true });
      return;
    }

    try {
      setIsResending(true);
      setError("");
      await api("/api/auth/resend-verification", {
        method: "POST",
        auth: false,
        body: { email },
      });
      navigate("/verify-email", {
        replace: true,
        state: { codeResent: true },
      });
    } catch (requestError) {
      setError(requestError.message || "Could not send a new code. Please try again.");
      setIsResending(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <div className="reset-link-expired-wrapper">
        <Card>
          <div className="reset-link-expired-page">
            <h1 className="reset-link-expired-title">
              This code is no longer valid
            </h1>

            <p className="reset-link-expired-subtitle">
              It may have expired or already been used.
              <br />
              Request a new code to safely verify your email.
            </p>

            <div className="reset-link-expired-actions">
              <Button onClick={requestNewCode} disabled={isResending}>
                {isResending ? "Sending code…" : "Request a new code"}
              </Button>

              <Button secondary to="/sign-in">
                Back to sign in
              </Button>
            </div>

            {error && (
              <p className="reset-link-expired-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
