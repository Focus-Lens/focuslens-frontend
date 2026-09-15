import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../components/ui/CommonUI";
import { parent } from "../../data/mockData";
import { verifyEmail, resendVerification } from "../../services/auth";
import { ApiError } from "../../services/apiClient";
import { Mail, CheckCircle2, X, Clock3 } from "lucide-react";
import "../../css/auth/VerifyEmail.css";

function maskEmail(email) {
  const [name, domain] = email.split("@");

  if (!domain) return email;

  return `${name.charAt(0)}••••@${domain}`;
}

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [toast, setToast] = useState("");
  const [toastDescription, setToastDescription] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const email =
    searchParams.get("email") ||
    sessionStorage.getItem("pendingParentEmail") ||
    parent.email;

  // لو اللينك اللي جه من الإيميل يحتوي على otp داخل الـ URL، نتحقق تلقائيًا
  // بدون أي ضغط من المستخدم — بنفس الشكل اللي كان موجود (toast ثم انتقال).
  useEffect(() => {
    const otpFromUrl = searchParams.get("otp") || searchParams.get("code");

    if (!otpFromUrl) return;

    let isCancelled = false;

    async function autoVerify() {
      setIsOpening(true);

      try {
        await verifyEmail({ email, otp: otpFromUrl });

        if (isCancelled) return;

        setToastDescription("Your parent account is ready.");
        setToast("Email verified");

        setTimeout(() => {
          if (!isCancelled) navigate("/account-created");
        }, 3000);
      } catch (err) {
        if (isCancelled) return;

        setIsOpening(false);
        setToastDescription(
          err instanceof ApiError
            ? err.message
            : "We couldn't verify this link. Please try again."
        );
        setToast("Verification failed");
      }
    }

    autoVerify();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function openEmailApp() {
    if (isOpening) return;

    setIsOpening(true);
    setToastDescription("Your parent account is ready.");
    setToast("Email verified");

    setTimeout(() => {
      navigate("/account-created");
    }, 3000);
  }

  async function resendLink() {
    try {
      await resendVerification({ email });
      setToastDescription("Check your inbox and spam folder.");
      setToast("Verification link sent");
    } catch (err) {
      setToastDescription(
        err instanceof ApiError
          ? err.message
          : "We couldn't resend the link. Please try again."
      );
      setToast("Verification failed");
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
              {toastDescription ||
                (toast === "Email verified"
                  ? "Your parent account is ready."
                  : "Check your inbox and spam folder.")}
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
            We sent a secure verification link to{" "}
            <b>{maskEmail(email)}</b>
          </p>

          <div className="verify-email-actions">
            <button
              type="button"
              className="open-email-button"
              onClick={openEmailApp}
              disabled={isOpening}
            >
              {isOpening ? "Email verified" : "Open email app"}
            </button>

            <button
              type="button"
              className="resend-email-button"
              onClick={resendLink}
            >
              Resend link
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
            <span>The link expires in 15 minutes</span>
          </div>
        </section>
      </main>
    </AuthLayout>
  );
}
