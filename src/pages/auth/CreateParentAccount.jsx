import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import TermsPrivacyModal from "../../components/ui/TermsPrivacyModal";
import "../../css/auth/CreateParentAccount.css";

export default function CreateParentAccount() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const emailHasError =
    emailTouched &&
    email.trim().length > 0 &&
    !emailIsValid;

  const formIsValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailIsValid &&
    acceptedTerms;

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleError("");

      // احتفظي بالتوكن مؤقتًا لحين ربطه بالـ backend
      sessionStorage.setItem(
        "googleAccessToken",
        tokenResponse.access_token
      );

      console.log("Google login successful:", tokenResponse);

      // ضعي هنا الانتقال للصفحة المناسبة بعد تسجيل الدخول بجوجل
      // navigate("/dashboard");
    },
    onError: () => {
      setGoogleError("Google sign-in failed. Please try again.");
    },
  });

  function agreeToTerms() {
    setAcceptedTerms(true);
    setShowTerms(false);
  }

  function handleContinue() {
    if (!formIsValid) return;

    const registrationDraft = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      acceptTerms: acceptedTerms,
    };

    sessionStorage.setItem(
      "pendingRegistration",
      JSON.stringify(registrationDraft)
    );
    sessionStorage.setItem("pendingParentEmail", registrationDraft.email);

    navigate("/create-password");
  }

  return (
    <AuthLayout hideFooter>
      <section className="create-parent-account">
        <Card title="Create your parent account">
          <p className="auth-subtitle">
            Add your details first. You’ll create your password next.
          </p>

          <div className="name-fields">
            <Field
              className="name-field"
              label="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />

            <Field
              className="name-field"
              label="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>

          <div className="email-field-wrapper">
            <Field
              className={emailHasError ? "field-error" : ""}
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
            />

            {emailHasError && (
              <p className="email-error">
                Please enter a valid email address.
              </p>
            )}
          </div>

          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />

            <button
              type="button"
              className="terms-link"
              onClick={() => setShowTerms(true)}
            >
              I agree to the Terms and Privacy Policy
            </button>
          </label>

          <div className="register-actions">
            {formIsValid ? (
              <Button onClick={handleContinue}>Continue</Button>
            ) : (
              <button type="button" className="continue-disabled" disabled>
                Continue
              </button>
            )}
          </div>

          <button
            type="button"
            className="google-button"
            aria-label="Continue with Google"
            onClick={() => loginWithGoogle()}
          >
            <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.69 2.91-4.18 2.91-7.29Z" />
              <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.23l-3.14-2.52c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.71-5.46-4.01H3.3v2.6A9.75 9.75 0 0 0 12 21.75Z" />
              <path fill="#FBBC05" d="M6.54 13.92a5.87 5.87 0 0 1 0-3.83v-2.6H3.3a9.75 9.75 0 0 0 0 9.03l3.24-2.6Z" />
              <path fill="#EA4335" d="M12 6.08c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.49l3.24 2.6C7.31 7.79 9.46 6.08 12 6.08Z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {googleError && <p className="email-error">{googleError}</p>}

          <p className="already-account">
            Already have an account? <a href="/sign-in">Sign in</a>
          </p>
        </Card>
      </section>

      {showTerms && (
        <TermsPrivacyModal
          onClose={() => setShowTerms(false)}
          onAgree={agreeToTerms}
        />
      )}
    </AuthLayout>
  );
}
