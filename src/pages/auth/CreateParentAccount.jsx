import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import TermsPrivacyModal from "../../components/ui/TermsPrivacyModal";
import "../../css/auth/CreateParentAccount.css";
import { useAuth } from "../../context/AuthContext";

export default function CreateParentAccount() {
  const navigate = useNavigate();
  const { loginWithGoogleParent } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  async function handleGoogleSuccess(response) {
    if (isGoogleLoading) return;

    if (!acceptedTerms) {
      setGoogleError("Accept the Terms and Privacy Policy before continuing with Google.");
      return;
    }

    try {
      setGoogleError("");
      setIsGoogleLoading(true);
      await loginWithGoogleParent(response.credential, true);
      navigate("/overview");
    } catch (error) {
      console.error("Google parent sign-in failed:", error);
      setGoogleError("Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

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

          <div className="google-button" aria-busy={isGoogleLoading}>
            {isGoogleLoading ? (
              <span className="google-loading-state">
                <span className="button-spinner" aria-hidden="true" />
                Signing in with Google…
              </span>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError("Google sign-in failed. Please try again.")}
                text="continue_with"
                shape="rectangular"
                width="360"
              />
            )}
          </div>

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
