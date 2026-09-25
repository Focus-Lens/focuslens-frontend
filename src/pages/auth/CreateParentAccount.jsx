import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../../components/ui/GoogleAuthButton";
import EmailStatusAlert from "../../components/ui/EmailStatusAlert";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getGoogleProfile } from "../../services/googleIdentity";
import {
  getEmailAvailability,
  isStudentEmailError,
  isStudentEmailResult,
} from "../../services/emailAccountStatus";
import TermsPrivacyModal from "../../components/ui/TermsPrivacyModal";
import "../../css/auth/CreateParentAccount.css";

export default function CreateParentAccount() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const savedRegistration = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("pendingParentRegistration") || "null") || {};
    } catch {
      return {};
    }
  })();

  const [firstName, setFirstName] = useState(savedRegistration.firstName || "");
  const [lastName, setLastName] = useState(savedRegistration.lastName || "");
  const [email, setEmail] = useState(savedRegistration.email || "");
  const [emailTouched, setEmailTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailError, setEmailError] = useState(() => {
    const error = sessionStorage.getItem("parentRegistrationEmailError") || "";
    sessionStorage.removeItem("parentRegistrationEmailError");
    return error;
  });
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState("");

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const emailHasError =
    (emailTouched && email.trim().length > 0 && !emailIsValid) ||
    Boolean(fieldErrors.email);

  function validateRegistration() {
    const nextErrors = {};

    if (!firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required.";

    if (!email.trim()) nextErrors.email = "Email address is required.";
    else if (!emailIsValid) nextErrors.email = "Please enter a valid email address.";

    if (!acceptedTerms) {
      nextErrors.terms = "Please agree to the Terms and Privacy Policy to continue.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function selectGoogleAccount(credentialResponse) {
    try {
      const profile = getGoogleProfile(credentialResponse.credential);
      if (!profile.email) throw new Error("Google did not provide an email address.");
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setEmailTouched(false);
      setPendingGoogleIdToken(credentialResponse.credential);
      setFieldErrors({});
      setEmailError("");
      setGoogleError("");

      if (acceptedTerms) {
        continueGoogleRegistration(profile, credentialResponse.credential);
      } else {
        setShowTerms(true);
      }
    } catch (error) {
      setGoogleError(error.message || "Google sign-in failed. Please try again.");
    }
  }

  async function continueGoogleRegistration(profile, idToken) {
    if (isCheckingEmail) return;

    try {
      setIsCheckingEmail(true);
      setEmailError("");

      const result = await api("/api/auth/check-email", {
        method: "POST",
        auth: false,
        body: { email: profile.email.trim() },
      });

      if (isStudentEmailResult(result)) {
        setEmailError("This email belongs to a student account. Please use the student sign-in page.");
        return;
      }

      if (getEmailAvailability(result) === false) {
        setEmailError(
          "This email is already associated with a parent account. Sign in or use another email.",
        );
        return;
      }

      await finishGoogleRegistration(idToken);
    } catch (error) {
      if (isStudentEmailError(error)) {
        setEmailError("This email belongs to a student account. Please use the student sign-in page.");
      } else if (error.status === 409) {
        setEmailError(
          "This email is already associated with a parent account. Sign in or use another email.",
        );
      } else {
        setEmailError(error.message || "We couldn’t check this email. Please try again.");
      }
    } finally {
      setIsCheckingEmail(false);
    }
  }

  async function finishGoogleRegistration(idToken) {
    const response = await api("/api/auth/google/parent", {
      method: "POST",
      auth: false,
      body: { idToken },
    });

    const account = login(response);
    navigate(
      sessionStorage.getItem("pendingInvitationToken")
        ? "/choose-start"
        : account.requiresOnboarding
          ? "/account-created"
          : "/overview",
    );
  }

  function agreeToTerms() {
    setAcceptedTerms(true);
    setShowTerms(false);
    if (pendingGoogleIdToken) {
      try {
        const profile = getGoogleProfile(pendingGoogleIdToken);
        continueGoogleRegistration(profile, pendingGoogleIdToken);
      } catch (error) {
        setGoogleError(error.message || "Google sign-in failed. Please try again.");
      }
    }
  }

  async function handleContinue() {
    if (isCheckingEmail || !validateRegistration()) return;

    try {
      setIsCheckingEmail(true);
      setEmailError("");

      const result = await api("/api/auth/check-email", {
        method: "POST",
        auth: false,
        body: { email: email.trim() },
      });

      if (isStudentEmailResult(result)) {
        setEmailError("This email belongs to a student account. Please use the student sign-in page.");
        return;
      }

      if (getEmailAvailability(result) === false) {
        setEmailError(
          "This email is already associated with a parent account. Sign in or use another email.",
        );
        return;
      }

      if (pendingGoogleIdToken) {
        await finishGoogleRegistration(pendingGoogleIdToken);
        return;
      }

      sessionStorage.setItem(
        "pendingParentRegistration",
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          acceptTerms: true,
        }),
      );

      navigate("/create-password");
    } catch (error) {
      if (isStudentEmailError(error)) {
        setEmailError("This email belongs to a student account. Please use the student sign-in page.");
      } else if (error.status === 409) {
        setEmailError(
          "This email is already associated with a parent account. Sign in or use another email.",
        );
      } else {
        setEmailError(error.message || "We couldn’t check this email. Please try again.");
      }
    } finally {
      setIsCheckingEmail(false);
    }
  }

  return (
    <AuthLayout hideFooter>
      <section className="create-parent-account">
        <Card title="Create your parent account">
          <p className="auth-subtitle">
            Add your details first. You’ll create your password next.
          </p>

          <div className="name-fields">
            <div className="name-field-wrapper">
              <Field
                aria-invalid={Boolean(fieldErrors.firstName)}
                className={fieldErrors.firstName ? "name-field field-error" : "name-field"}
                label="First name"
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                  setFieldErrors((current) => ({ ...current, firstName: "" }));
                }}
              />
              {fieldErrors.firstName && (
                <p className="field-error-message">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="name-field-wrapper">
              <Field
                aria-invalid={Boolean(fieldErrors.lastName)}
                className={fieldErrors.lastName ? "name-field field-error" : "name-field"}
                label="Last name"
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                  setFieldErrors((current) => ({ ...current, lastName: "" }));
                }}
              />
              {fieldErrors.lastName && (
                <p className="field-error-message">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="email-field-wrapper">
            <Field
              className={emailHasError || emailError ? "field-error" : ""}
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setPendingGoogleIdToken("");
                setEmailTouched(true);
                setEmailError("");
                setFieldErrors((current) => ({ ...current, email: "" }));
              }}
              onBlur={() => setEmailTouched(true)}
            />

            {fieldErrors.email || (emailTouched && !emailIsValid && email.trim()) ? (
              <p className="email-error">
                {fieldErrors.email || "Please enter a valid email address."}
              </p>
            ) : emailError ? (
              emailError.includes("parent account") ? (
                <EmailStatusAlert
                  actionText="Sign in"
                  actionTo="/sign-in"
                  message={emailError}
                />
              ) : emailError.toLowerCase().includes("student account") ? (
                <EmailStatusAlert message={emailError} />
              ) : (
                <p className="email-error">{emailError}</p>
              )
            ) : null}
          </div>

          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setFieldErrors((current) => ({ ...current, terms: "" }));
              }}
            />

            <button
              type="button"
              className="terms-link"
              onClick={() => setShowTerms(true)}
            >
              I agree to the Terms and Privacy Policy
            </button>
          </label>

          {fieldErrors.terms && (
            <p className="terms-error">{fieldErrors.terms}</p>
          )}

          <div className="register-actions">
            <Button onClick={handleContinue} disabled={isCheckingEmail}>
              {isCheckingEmail ? "Checking email..." : "Continue"}
            </Button>
          </div>

          <div className="google-button-wrap">
            <GoogleAuthButton
              onSuccess={selectGoogleAccount}
              onError={() => setGoogleError("Google sign-in failed. Please try again.")}
            />
          </div>

          {googleError && <p className="email-error">{googleError}</p>}

          <p className="already-account">
            Already have an account? <Link to="/sign-in">Sign in</Link>
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
