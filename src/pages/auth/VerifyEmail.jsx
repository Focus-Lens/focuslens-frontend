import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Mail, CheckCircle2, CircleAlert, X, Clock3 } from "lucide-react";
import "../../css/auth/VerifyEmail.css";

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!domain) return email;

  return `${name.charAt(0)}••••@${domain}`;
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [toast, setToast] = useState(() =>
    location.state?.codeResent ? "Verification code sent" : "",
  );
  const [isOpening, setIsOpening] = useState(false);
  const [otp, setOtp] = useState("");
  const [errorToast, setErrorToast] = useState("");
  const errorToastTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(errorToastTimer.current), []);

  function showError(message) {
    setToast("");
    setErrorToast(message);
    window.clearTimeout(errorToastTimer.current);
    errorToastTimer.current = window.setTimeout(() => setErrorToast(""), 3000);
  }

  const email =
    sessionStorage.getItem("pendingParentEmail") || "";

  async function verifyCode() {
    if (isOpening) return;
    setIsOpening(true);
    try {
      const verification = await api("/api/auth/verify-email", { method: "POST", auth: false, body: { email, otp } });
      if (verification?.tokens?.accessToken) {
        let registration = null;
        try {
          registration = JSON.parse(sessionStorage.getItem("pendingParentRegistration") || "null");
        } catch {
          registration = null;
        }
        login({
          ...verification,
          firstName: verification.firstName || verification.user?.firstName || registration?.firstName,
          lastName: verification.lastName || verification.user?.lastName || registration?.lastName,
          email: verification.email || registration?.email || email,
        });
        sessionStorage.removeItem("pendingParentRegistration");
      }
      setToast("Email verified");
      navigate("/account-created");
    } catch (requestError) {
      const message = requestError.message || "";
      if (
        /code|otp/i.test(message) &&
        /invalid|expired|no longer valid|already used/i.test(message)
      ) {
        navigate("/verify-email/expired", { replace: true });
        return;
      }
      showError(requestError.message || "We couldn’t verify your email. Please try again.");
      setIsOpening(false);
    }
  }

  async function resendCode() {
    try {
      await api("/api/auth/resend-verification", { method: "POST", auth: false, body: { email } });
      setToast("Verification code sent");
    } catch (requestError) {
      showError(requestError.message || "Could not resend the code. Please try again.");
    }
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

      {errorToast && (
        <div className="email-toast email-error-toast" role="alert" aria-live="assertive">
          <div className="toast-icon">
            <CircleAlert size={22} strokeWidth={2.5} />
          </div>

          <div className="toast-content">
            <div className="toast-title">Couldn’t complete verification</div>
            <div className="toast-description">{errorToast}</div>
          </div>

          <button
            type="button"
            className="toast-close"
            onClick={() => {
              window.clearTimeout(errorToastTimer.current);
              setErrorToast("");
            }}
            aria-label="Close error message"
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
            <label className="verify-code-field">
              <span>6-digit code</span>
              <input className="verify-code-input" inputMode="numeric" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit code" aria-label="6-digit code" />
            </label>
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
