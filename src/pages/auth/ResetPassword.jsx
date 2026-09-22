import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { api } from "../../services/api";

import {
  RiEyeLine,
  RiEyeCloseLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";

import "../../css/auth/ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAccountPasswordChange = location.pathname === "/change-password";

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const checks = [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "Uppercase and lowercase letters",
      passed: /[A-Z]/.test(password) && /[a-z]/.test(password),
    },
    {
      label: "At least one number",
      passed: /\d/.test(password),
    },
    {
      label: "At least one symbol",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const score = checks.filter((check) => check.passed).length;

  const strength =
    ["Weak", "Improving", "Good", "Strong"][score - 1] || "Weak";

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canReset = score === 4 && passwordsMatch && (!isAccountPasswordChange || currentPassword.length > 0);

  async function handleReset() {
    try {
      if (isAccountPasswordChange) {
        await api("/api/users/change-password", {
          method: "POST",
          body: { currentPassword, newPassword: password, confirmPassword },
        });
        navigate("/profile", { replace: true });
        return;
      }
      const email = sessionStorage.getItem("pendingResetEmail");
      if (!email) throw new Error("Please request a password-reset code first.");
      await api("/api/auth/reset-password", { method: "POST", auth: false, body: { email, otp, newPassword: password } });
      sessionStorage.removeItem("pendingResetEmail");
      navigate("/reset-password/success");
    } catch (requestError) { setError(requestError.message); }
  }

  return (
    <AuthLayout hideFooter>
      <Card title="Create a new password">
        <p className="auth-subtitle">
          {isAccountPasswordChange
            ? "Enter your current password, then choose a secure new one."
            : "Choose a password you haven’t used for this account before."}
        </p>
        {isAccountPasswordChange && (
          <label className="password-field">
            <span>Current password</span>
            <div className="password-input-wrap">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter your current password"
              />
            </div>
          </label>
        )}
        {!isAccountPasswordChange && <label className="password-field">
          <span>Verification code</span>
          <div className={`password-input-wrap ${otp.length === 6 ? "password-valid" : ""}`}>
            <input
              className="verification-code-input"
              value={otp}
              inputMode="numeric"
              maxLength="6"
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
            />
          </div>
          {otp.length === 6 && <p className="password-good">Code entered</p>}
        </label>}

        <label className="password-field">
          <span>New password</span>

          <div
            className={`password-input-wrap ${
              score === 4 ? "password-valid" : ""
            }`}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a secure password"
            />

            <button
              type="button"
              className="eye-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <RiEyeLine /> : <RiEyeCloseLine />}
            </button>
          </div>

          {score === 4 && <p className="password-good">Looks good</p>}
        </label>

        <label className="password-field">
          <span>Confirm new password</span>

          <div
            className={`password-input-wrap ${
              passwordsMatch ? "password-valid" : ""
            }`}
          >
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
            />

            <button
              type="button"
              className="eye-button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? <RiEyeLine /> : <RiEyeCloseLine />}
            </button>
          </div>

          {passwordsMatch && <p className="password-good">Looks good</p>}
        </label>

        {confirmPassword && !passwordsMatch && (
          <p className="password-error">Passwords do not match.</p>
        )}
        {error && <p className="password-error">{error}</p>}

        <div className="password-strength-card">
          <div className="strength-heading">
            <b>{strength} password</b>
            <span>{score} of 4 checks</span>
          </div>

          <div className="strength-bars">
            {[1, 2, 3, 4].map((item) => (
              <i
                key={item}
                className={item <= score ? "strength-filled" : ""}
              />
            ))}
          </div>

          <div className="strength-labels">
            <span>Weak</span>
            <span>Improving</span>
            <span>Good</span>
            <span>Strong</span>
          </div>

          <div className="password-checks">
            {checks.map((check) => (
              <p key={check.label} className={check.passed ? "passed" : ""}>
                <span className="check-icon">
                  {check.passed ? <RiCheckLine /> : "•"}
                </span>

                {check.label}
              </p>
            ))}
          </div>
        </div>

        <div className="password-actions">
          <button
            type="button"
            className="back-password-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <RiArrowLeftLine />
          </button>

          {canReset && (isAccountPasswordChange || otp.length === 6) ? (
            <Button onClick={handleReset}>
              {isAccountPasswordChange ? "Save new password" : "Reset password"}
            </Button>
          ) : (
            <button type="button" className="verify-disabled" disabled>
              {isAccountPasswordChange ? "Save new password" : "Reset password"}
            </button>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
}
