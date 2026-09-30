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
import {
  api,
  forgetRememberedSession,
  getRememberedSession,
  rememberSession,
  restoreRememberedSession,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { getGoogleProfile } from "../../services/googleIdentity";
import { continueWithGoogleParent } from "../../services/googleParentAuth";
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
  const { login, setUser } = useAuth();
  const hasPendingInvitation = Boolean(
    sessionStorage.getItem("pendingInvitationToken"),
  );

  // A session saved by "Remember me": the form is filled in from it and
  // Sign in continues it without asking for the password again.
  const [rememberedSession, setRememberedSession] = useState(() =>
    restoreAccount ? null : getRememberedSession(),
  );
  const [email, setEmail] = useState(() =>
    restoreAccount
      ? ""
      : rememberedSession?.user?.email || localStorage.getItem(REMEMBERED_EMAIL_KEY) || "",
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() =>
    !restoreAccount &&
      Boolean(rememberedSession || localStorage.getItem(REMEMBERED_EMAIL_KEY)),
  );
  const [error, setError] = useState("");
  const [errorLink, setErrorLink] = useState(null);
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);

  function nextPathAfterSignIn() {
    if (restoreAccount) return "/overview";
    return (location.state?.returnTo !== "/account-created" && location.state?.returnTo) ||
      (sessionStorage.getItem("pendingInvitationToken") ? "/choose-start" : "/overview");
  }

  function saveRememberMe(account) {
    if (restoreAccount) return;
    if (rememberMe && account) {
      if (account.email) localStorage.setItem(REMEMBERED_EMAIL_KEY, account.email);
      rememberSession(account);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      forgetRememberedSession();
    }
  }

  async function continueRememberedSession() {
    try {
      setIsSubmitting(true);
      setError("");
      setErrorLink(null);

      const account = await restoreRememberedSession();
      if (!account) {
        // The saved session is no longer valid: start over with an empty form.
        setRememberedSession(null);
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        setEmail("");
        setPassword("");
        return;
      }

      setUser(account);
      navigate(nextPathAfterSignIn());
    } catch (requestError) {
      setError(requestError.message || "We couldn’t sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchAccount() {
    forgetRememberedSession();
    setRememberedSession(null);
    setEmail("");
    setPassword("");
    setError("");
    setErrorLink(null);
  }

  async function handleSignIn() {
    if (rememberedSession) {
      await continueRememberedSession();
      return;
    }

    if (!email.trim() || !password.trim()) {
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

      const response = await api("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), password },
      });

      const account = login(response);
      saveRememberMe(account);
      navigate(nextPathAfterSignIn());
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
    if (isSubmitting) return;

    try {
      const profile = getGoogleProfile(credentialResponse.credential);
      setEmail(profile.email);
      setPassword("");
      setError("");
      setErrorLink(null);
      setIsSubmitting(true);
      setGoogleSigningIn(true);

      const { nextPath, account } = await continueWithGoogleParent(
        credentialResponse.credential,
        login,
      );
      saveRememberMe(account);
      navigate(
        (location.state?.returnTo !== "/account-created" && location.state?.returnTo) || nextPath,
      );
    } catch (requestError) {
      setError(requestError.message || "Google sign-in failed. Please try again.");
      setIsSubmitting(false);
      setGoogleSigningIn(false);
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
            // Typing another email means signing in to a different account.
            if (
              rememberedSession &&
              nextEmail.trim().toLowerCase() !==
                rememberedSession.user.email?.trim().toLowerCase()
            ) {
              setRememberedSession(null);
            }
            if (rememberMe && !restoreAccount) {
              if (nextEmail.trim()) localStorage.setItem(REMEMBERED_EMAIL_KEY, nextEmail.trim());
              else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }
            setError("");
            setErrorLink(null);
          }}
        />

        {rememberedSession ? (
          <>
            {/* The password itself is never stored; the saved session is used. */}
            <Field
              name="password"
              label="Password"
              type="password"
              value="rememberedpw"
              readOnly
              aria-describedby="remembered-session-note"
            />
            <p className="signin-remembered-note" id="remembered-session-note">
              You’re remembered on this device.{" "}
              <button type="button" onClick={switchAccount}>
                Use a different account
              </button>
            </p>
          </>
        ) : (
          <Field
            name="password"
            required
            autoComplete="current-password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}

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
                  if (!checked && rememberedSession) {
                    forgetRememberedSession();
                    setRememberedSession(null);
                  }
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
              : isSubmitting
                ? "Signing in..."
                : rememberedSession?.user?.firstName
                  ? `Continue as ${rememberedSession.user.firstName}`
                  : "Continue"}
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

        {googleSigningIn && (
          <p className="signin-subtitle" role="status">Signing you in with Google…</p>
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
