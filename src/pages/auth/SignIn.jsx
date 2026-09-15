import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthLayout,
  Button,
  Card,
  Field,
} from "../../components/ui/CommonUI";
import { child } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/apiClient";
import "../../css/auth/SignIn.css";

function postAuthDestination() {
  const token = sessionStorage.getItem("pendingInvitationToken");

  return token ? "/review-invitation" : "/overview";
}

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");

    try {
      await login({ email: email.trim(), password });
      navigate(postAuthDestination());
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <AuthLayout hideFooter>
      <Card title="Welcome back">
        <p className="signin-subtitle">
          Sign in to continue with {child.preferredName}’s invitation.
        </p>

        <Field
          label="Email address or phone number"
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

        <div className="form-row">
          <label className="check">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <div className="actions signin-actions">
          <Button onClick={handleSignIn}>Sign in</Button>
        </div>

        <p className="already-account">
          New to FocusLens?{" "}
          <Link to="/register">Create a parent account</Link>
        </p>

        <p className="invitation-expiry">
          Invitation expires in 7 days
        </p>
      </Card>
    </AuthLayout>
  );
}
