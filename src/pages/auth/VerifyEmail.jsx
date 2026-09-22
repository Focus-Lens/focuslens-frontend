import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { Mail, CheckCircle2, X, Clock3 } from "lucide-react";
import "../../css/auth/VerifyEmail.css";

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!domain) return email;

  return `${name.charAt(0)}••••@${domain}`;
}

export default function VerifyEmail() {
  const navigate = useNavigate();

  const [toast, setToast] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const email =
    sessionStorage.getItem("pendingParentEmail") || "";

  async function verifyCode() {
    if (isOpening) return;
    setIsOpening(true);
    try {
      await api("/api/auth/verify-email", { method: "POST", auth: false, body: { email, otp } });
      setToast("Email verified");
      navigate("/choose-start");
    } catch (requestError) {
      setError(requestError.message);
      setIsOpening(false);
    }
  }

  async function resendCode() {
    try {
      await api("/api/auth/resend-verification", { method: "POST", auth: false, body: { email } });
      setToast("Verification code sent");
    } catch (requestError) { setError(requestError.message); }
  }

  function useDifferentEmail() {
    navigate("/register");
  }

  return (
    <AuthLayout hideFooter>
      {toast && (
        <div className="email-toast">
          <div className="toast-icon">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>

          <div className="toast-content">
            <div className="toast-title">{toast}</div>

            <div className="toast-description">
              {toast === "Email verified"
                ? "Your parent account is ready."
                : "Check your inbox and spam folder."}
            </div>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => setToast("")}
            aria-label="Close notification"
          >
            <X size={20} />
          </button>
        </div>
      )}

      <main className="verify-email-page">
        <section className="verify-email-card">
          <div className="mail-icon">
            <Mail size={23} strokeWidth={1.8} />
          </div>

          <h1>Check your email</h1>

          <p className="verification-text">
            We sent a 6-digit verification code to{" "}
            <b>{maskEmail(email)}</b>
          </p>

          <div className="verify-email-actions">
            <input className="verify-code-input" inputMode="numeric" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="6-digit code" aria-label="Verification code" />
            <button type="button" className="open-email-button" onClick={verifyCode} disabled={isOpening || otp.length !== 6}>
              {isOpening ? "Verifying..." : "Verify email"}
            </button>

            <button
              type="button"
              className="resend-email-button"
              onClick={resendCode}
            >
              Resend code
            </button>
          </div>
          {error && <p className="password-error">{error}</p>}

          <button
            type="button"
            className="different-email-button"
            onClick={useDifferentEmail}
          >
            Use a different email
          </button>

          <p className="privacy-message">
            For privacy, recovery and sign-in messages never reveal whether an
            account exists.
          </p>

          <div className="expiry-message">
            <Clock3 size={15} strokeWidth={1.8} />
            <span>The code expires in 10 minutes</span>
          </div>
        </section>
      </main>
    </AuthLayout>
  );
}
