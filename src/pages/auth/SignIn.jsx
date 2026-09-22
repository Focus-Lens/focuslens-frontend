import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  AuthLayout,
  Button,
  Card,
  Field,
} from "../../components/ui/CommonUI";
import { useChildProfile } from "../../context/ChildProfileContext";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../css/auth/SignIn.css";

export default function SignIn({ restoreAccount = false }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { child } = useChildProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setError("");

      const response = await api("/api/auth/login", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), password },
      });

      login(response);

      navigate(
        sessionStorage.getItem("pendingInvitationToken")
          ? "/choose-start"
          : "/overview",
      );
    } catch (requestError) {
      setError(requestError.message);
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
      setError("");

      const response = await api("/api/auth/google/parent", {
        method: "POST",
        auth: false,
        body: { idToken: credentialResponse.credential },
      });

      login(response);

      navigate(
        sessionStorage.getItem("pendingInvitationToken")
          ? "/choose-start"
          : "/overview",
      );
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  }

  return (
    <AuthLayout hideFooter>
      <Card title={restoreAccount ? "Restore your account" : "Welcome back"}>
        <p className="signin-subtitle">
          {restoreAccount
            ? "Enter the details for the account you want to restore."
            : `Sign in to continue with ${child.preferredName || "your child"}’s invitation.`}
        </p>

        <Field
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p className="password-error">{error}</p>}

        {success && (
          <p className="signin-subtitle">
            {success} <Link to="/sign-in">Sign in</Link>
          </p>
        )}

        {!restoreAccount && (
          <div className="form-row">
            <label className="check">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        )}

        <div className="actions signin-actions">
          <Button
            disabled={isSubmitting}
            onClick={restoreAccount ? restoreDeletedAccount : handleSignIn}
          >
            {restoreAccount
              ? isSubmitting
                ? "Restoring..."
                : "Restore account"
              : "Sign in"}
          </Button>
        </div>

        {!restoreAccount && (
          <div className="google-button-wrap">
  <GoogleLogin
    onSuccess={signInWithGoogle}
    onError={() => setError("Google sign-in failed. Please try again.")}
    text="continue_with"
    locale="en"
    theme="outline"
    size="medium"
    shape="pill"
    width="400"
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
