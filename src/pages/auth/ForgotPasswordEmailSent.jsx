import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";
import { forgotPassword } from "../../services/auth";
import { ApiError } from "../../services/apiClient";
import "../../css/auth/ForgotPasswordEmailSent.css";

export default function ForgotPasswordEmailSent() {
  const navigate = useNavigate();

  const [toast, setToast] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isOpeningEmail, setIsOpeningEmail] = useState(false);

  const email =
    sessionStorage.getItem("pendingResetEmail") || parent.email;

  function handleOpenEmailApp() {
    if (isOpeningEmail) return;

    setIsOpeningEmail(true);
    setToastMessage("Check your inbox and spam folder.");
    setToast("Verification link sent");

    setTimeout(() => {
      navigate("/reset-password");
    }, 3000);
  }

  async function handleResend() {
    try {
      await forgotPassword({ email });
      setToastMessage("Check your inbox and spam folder.");
      setToast("Reset email sent");
    } catch (err) {
      setToastMessage(
        err instanceof ApiError
          ? err.message
          : "We couldn't resend the email. Please try again."
      );
      setToast("Resend failed");
    }

    setTimeout(() => {
      setToast("");
    }, 3000);
  }

  function closeToast() {
    setToast("");
  }

  return (
    <AuthLayout hideFooter>
      <div className="reset-email-page">
        {toast && (
          <div className="toast toast-success">
            <div className="toast-icon">
              <CheckCircle2 size={25} strokeWidth={2.5} />
            </div>

            <div className="toast-text">
              <b>{toast}</b>
              <p>{toastMessage || "Check your inbox and spam folder."}</p>
            </div>

            <button
              type="button"
              className="toast-close"
              onClick={closeToast}
              aria-label="Close notification"
            >
              <X size={24} strokeWidth={1.7} />
            </button>
          </div>
        )}

        <Card title="Check your email">
          <p>
            If an account exists for {email}, we’ve sent a password reset
            link. Check your inbox and spam folder.
          </p>

          <div className="actions">
            <Button
              onClick={handleOpenEmailApp}
              disabled={isOpeningEmail}
            >
              {isOpeningEmail ? "Verification link sent" : "Open email app"}
            </Button>

            <Button secondary onClick={handleResend}>
              Resend reset email
            </Button>
          </div>

          <p className="already-account">
            <button
              type="button"
              className="terms-link link-center"
              onClick={() => navigate("/forgot-password")}
            >
              Use a different email
            </button>
          </p>

          <p className="hint">
            The link expires in 30 minutes and can only be used once. Your
            invitation remains attached.
          </p>
        </Card>
      </div>
    </AuthLayout>
  );
}
