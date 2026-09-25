import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import GoogleAuthButton from "../../components/ui/GoogleAuthButton";
import EmailStatusAlert from "../../components/ui/EmailStatusAlert";
import {
  AuthLayout,
  Button,
  Card,
  Field,
} from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getGoogleProfile } from "../../services/googleIdentity";
import {
  getEmailAvailability,
  isEmailNotFoundError,
  isStudentEmailError,
  isStudentEmailResult,
} from "../../services/emailAccountStatus";
import "../../css/auth/SignIn.css";

const REMEMBERED_EMAIL_KEY = "focusLensRememberedSignInEmail";

export default function SignIn({ restoreAccount = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const hasPendingInvitation = Boolean(
    sessionStorage.getItem("pendingInvitationToken"),
  );

  const [email, setEmail] = useState(() =>
    restoreAccount ? "" : localStorage.getItem(REMEMBERED_EMAIL_KEY) || "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() =>
    !restoreAccount && Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)),
  );
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState(null);
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState("");

  async function handleSignIn() {
    if (!email.trim() || (!password.trim() && !pendingGoogleIdToken)) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setErrorLink(null);

      const emailStatus = await api("/api/auth/check-email", {
        method: "POST",
        auth: false,
        body: { email: email.trim() },
      });

      if (isStudentEmailResult(emailStatus)) {
        setError("This email belongs to a student account. Please use the student sign-in page.");
        return;
      }

      if (getEmailAvailability(emailStatus) === true) {
        setError("No parent account was found with this email.");
        setErrorLink("register");
        return;
      }

      const response = pendingGoogleIdToken
        ? await api("/api/auth/google/parent", {
            method: "POST",
            auth: false,
            body: { idToken: pendingGoogleIdToken },
          })
        : await api("/api/auth/login", {
            method: "POST",
            auth: false,
            body: { email: email.trim(), password },
          });

      login(response);
      const pendingInvitationToken = sessionStorage.getItem("pendingInvitationToken");

      if (!restoreAccount) {
        if (rememberMe && email.trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      }

      navigate(
        restoreAccount
          ? "/overview"
          : (location.state?.returnTo !== "/account-created" && location.state?.returnTo) ||
            (pendingInvitationToken
              ? "/choose-start"
              : "/overview"),
      );
    } catch (requestError) {
      if (isStudentEmailError(requestError)) {
        setError("This email belongs to a student account. Please use the student sign-in page.");
      } else if (isEmailNotFoundError(requestError)) {
        setError("No parent account was found with this email.");
        setErrorLink("register");
      } else {
        setError(requestError.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function restoreDeletedAccount() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api("/api/auth/restore-account", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), password },
      });

      setSuccess("Your account has been restored. You can sign in now.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithGoogle(credentialResponse) {
    try {
      const profile = getGoogleProfile(credentialResponse.credential);
      if (!profile.email) throw new Error("Google did not provide an email address.");
      setEmail(profile.email);
      setPassword("");
      setPendingGoogleIdToken(credentialResponse.credential);
      setError("");
      setErrorLink(null);
    } catch (requestError) {
      setError(requestError.message || "Google sign-in failed. Please try again.");
    }
  }

  return (
    <AuthLayout hideFooter>
      <Card
        className={restoreAccount ? "restore-account-card" : ""}
        title={restoreAccount ? "Restore your account" : "Welcome back"}
      >
        <p className="signin-subtitle">
          {restoreAccount
            ? "Enter the details for the account you want to restore."
            : hasPendingInvitation
              ? "Sign in to continue with your child’s invitation."
              : "Sign in to continue"}
        </p>

        <form
          className="signin-form"
          autoComplete="on"
          onSubmit={(event) => {
            event.preventDefault();
            if (restoreAccount) restoreDeletedAccount();
            else handleSignIn();
          }}
        >
        <Field
          name="email"
          required
          autoComplete="username"
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => {
            const nextEmail = event.target.value;
            setEmail(nextEmail);
            if (rememberMe && !restoreAccount) {
              if (nextEmail.trim()) localStorage.setItem(REMEMBERED_EMAIL_KEY, nextEmail.trim());
              else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }
            setPendingGoogleIdToken("");
            setError("");
            setErrorLink(null);
          }}
        />

        <Field
          name="password"
          required={!pendingGoogleIdToken}
          autoComplete="current-password"
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && errorLink === "register" ? (
          <EmailStatusAlert
            actionText="Create account"
            actionTo="/register"
            message={error}
          />
        ) : error && error.toLowerCase().includes("student account") ? (
          <EmailStatusAlert message={error} />
        ) : error ? (
          <p className="password-error">
            {error}
          </p>
        ) : null}

        {success && (
          <p className="signin-subtitle">
            {success} <Link to="/sign-in">Sign in</Link>
          </p>
        )}

        {!restoreAccount && (
          <div className="form-row">
            <label className="check">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setRememberMe(checked);
                  if (checked && email.trim()) {
                    localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
                  } else {
                    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
                  }
                }}
              />
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        )}

        <div className="actions signin-actions">
          <Button type="submit" disabled={isSubmitting}>
            {restoreAccount
              ? isSubmitting
                ? "Restoring..."
                : "Restore account"
              : "Sign in"}
          </Button>
        </div>
        </form>

        {!restoreAccount && (
          <div className="google-button-wrap">
            <GoogleAuthButton
              onSuccess={signInWithGoogle}
              onError={() => setError("Google sign-in failed. Please try again.")}
            />
          </div>
        )}

        {!restoreAccount && (
          <p className="already-account">
            New to FocusLens?{" "}
            <Link to="/register">Create a parent account</Link>
          </p>
        )}

        <p className="already-account">
          <Link to={restoreAccount ? "/sign-in" : "/restore-account"}>
            {restoreAccount ? "Back to sign in" : "Restore a deleted account"}
          </Link>
        </p>

        {!restoreAccount && (
          <p className="invitation-expiry">
            Invitation expires in 7 days
          </p>
        )}
      </Card>
    </AuthLayout>
  );
}
