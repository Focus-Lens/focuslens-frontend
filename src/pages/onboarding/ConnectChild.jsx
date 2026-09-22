import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import { resolveAccessInvitation } from "../../services/api";
import "../../css/onboarding/ConnectChild.css";

export default function ConnectChild() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [invalidInvitationError, setInvalidInvitationError] = useState(
    () => location.state?.invitationError || "",
  );
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  async function handleContinue() {
    if (!code.trim()) {
      setError("Enter the private connection code your child shared.");
      return;
    }

    const invitationCode = code.trim();
    setError("");

    setIsCheckingCode(true);

    try {
      const invitation = await resolveAccessInvitation(invitationCode);
      sessionStorage.setItem("pendingInvitationToken", invitationCode);
      sessionStorage.setItem("pendingInvitationName", invitation.studentPreferredName || "");
      navigate("/review-invitation", { state: { invitation } });
    } catch {
      setInvalidInvitationError("This private invitation code is invalid or has expired.");
    } finally {
      setIsCheckingCode(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <div className="connect-child-wrapper">
        <Card title="Connect with your child">
          <p className="connect-child-subtitle">
            Enter the private code shown in your child’s FocusLens student app.
          </p>

          <div className="connect-child-field">
            <Field
              label="Private invitation code"
              placeholder="Ask your child for their private connection code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>

          {error && <p className="password-error">{error}</p>}

          <div className="connect-child-action">
            <Button disabled={isCheckingCode} onClick={handleContinue}>
              {isCheckingCode ? "Checking code…" : "Continue"}
            </Button>
          </div>

          <p className="connect-child-hint">
            For privacy, FocusLens does not offer public student search by name,
            school, email, or location.
          </p>
        </Card>
      </div>

      {invalidInvitationError && (
        <div className="invalid-code-overlay" role="presentation">
          <section
            aria-labelledby="invalid-code-title"
            aria-modal="true"
            className="invalid-code-modal"
            role="dialog"
          >
            <div className="invalid-code-icon" aria-hidden="true">!</div>
            <h2 id="invalid-code-title">That code didn’t work</h2>
            <p>
              {invalidInvitationError} Ask your child to share their current
              private invitation code, then try again.
            </p>
            <button type="button" onClick={() => setInvalidInvitationError("")}>
              Try again
            </button>
          </section>
        </div>
      )}
    </AuthLayout>
  );
}
