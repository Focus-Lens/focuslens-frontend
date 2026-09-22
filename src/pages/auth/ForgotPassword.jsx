import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import "../../css/auth/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSend() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setError("");
      await api("/api/auth/forgot-password", { method: "POST", auth: false, body: { email: email.trim() } });
      sessionStorage.setItem("pendingResetEmail", email.trim());
      navigate("/reset-password");
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <AuthLayout hideFooter>
      <main className="forgot-password-page">
        <Card title="Forgot your password?">
          <p className="forgot-password-text">
            Enter the email you use for your parent account.
            <br />
            We’ll help you reset your password.
          </p>

          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error && <p className="password-error">{error}</p>}

          <div className="password-actions">
            <button
              type="button"
              className="back-password-button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ←
            </button>

            <Button onClick={handleSend}>
              Send reset instructions
            </Button>
          </div>
        </Card>
      </main>
    </AuthLayout>
  );
}
