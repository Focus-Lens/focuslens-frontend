import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import { api } from "../../services/api";
import "../../css/auth/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSend() {
    const trimmedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await api("/api/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: { email: trimmedEmail },
      });

      sessionStorage.setItem("pendingResetEmail", trimmedEmail);
      navigate("/reset-password");
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            name="email"
            label="Email address"
            type="email"
            value={email}
            autoComplete="email"
            required
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />

          {error && (
            <p className="forgot-email-error" role="alert">
              {error}
            </p>
          )}

          <div className="password-actions">
            <button
              type="button"
              className="back-password-button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              ←
            </button>

            <Button
              type="button"
              onClick={handleSend}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </div>
        </Card>
      </main>
    </AuthLayout>
  );
}
