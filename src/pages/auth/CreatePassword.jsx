import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/apiClient";

import {
  RiEyeLine,
  RiEyeCloseLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";

import "../../css/auth/CreatePassword.css";

export default function CreatePassword() {
  const navigate = useNavigate();
  const { registerParent } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const checks = [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "Uppercase and lowercase letters",
      passed:
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password),
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

  const score = checks.filter(
    (check) => check.passed
  ).length;

  const strength =
    ["Weak", "Improving", "Good", "Strong"][score - 1] ||
    "Weak";

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canContinue = score === 4 && passwordsMatch;

  async function handleConfirm() {
    setSubmitError("");

    const draftRaw = sessionStorage.getItem("pendingRegistration");
    const draft = draftRaw ? JSON.parse(draftRaw) : null;

    if (!draft?.email) {
      setSubmitError("Registration details were lost. Please start again.");
      return;
    }

    try {
      await registerParent({
        email: draft.email,
        password,
        firstName: draft.firstName,
        lastName: draft.lastName,
        acceptTerms: draft.acceptTerms,
      });

      sessionStorage.setItem("pendingParentEmail", draft.email);
      sessionStorage.removeItem("pendingRegistration");

      navigate("/verify-email");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <AuthLayout hideFooter>
      <Card title="Create your password">

        <p className="auth-subtitle">
          Secure your parent account.
        </p>

        {/* =========================
            Password
        ========================= */}

        <label className="password-field">
          <span>Password</span>

          <div
            className={`password-input-wrap ${
              score === 4 ? "password-valid" : ""
            }`}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Create a secure password"
            />

            <button
              type="button"
              className="eye-button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showPassword ? (
                <RiEyeLine />
              ) : (
                <RiEyeCloseLine />
              )}
            </button>
          </div>

          {score === 4 && (
            <p className="password-good">
              Looks good
            </p>
          )}
        </label>

        {/* =========================
            Confirm Password
        ========================= */}

        <label className="password-field">
          <span>Confirm password</span>

          <div
            className={`password-input-wrap ${
              passwordsMatch
                ? "password-valid"
                : ""
            }`}
          >
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Repeat your password"
            />

            <button
              type="button"
              className="eye-button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <RiEyeLine />
              ) : (
                <RiEyeCloseLine />
              )}
            </button>
          </div>

          {passwordsMatch && (
            <p className="password-good">
              Looks good
            </p>
          )}
        </label>

        {/* =========================
            Password Error
        ========================= */}

        {confirmPassword &&
          !passwordsMatch && (
            <p className="password-error">
              Passwords do not match.
            </p>
          )}

        {submitError && (
          <p className="password-error">
            {submitError}
          </p>
        )}

        {/* =========================
            Password Strength
        ========================= */}

        <div className="password-strength-card">

          <div className="strength-heading">
            <b>{strength} password</b>

            <span>
              {score} of 4 checks
            </span>
          </div>

          {/* Strength bars */}

          <div className="strength-bars">
            {[1, 2, 3, 4].map((item) => (
              <i
                key={item}
                className={
                  item <= score
                    ? "strength-filled"
                    : ""
                }
              />
            ))}
          </div>

          {/* Strength labels */}

          <div className="strength-labels">
            <span>Weak</span>
            <span>Improving</span>
            <span>Good</span>
            <span>Strong</span>
          </div>

          {/* Password checks */}

          <div className="password-checks">
            {checks.map((check) => (
              <p
                key={check.label}
                className={
                  check.passed
                    ? "passed"
                    : ""
                }
              >
                <span className="check-icon">
                  {check.passed ? (
                    <RiCheckLine />
                  ) : (
                    "•"
                  )}
                </span>

                {check.label}
              </p>
            ))}
          </div>

        </div>

        {/* =========================
            Actions
        ========================= */}

        <div className="password-actions">

          {/* Back */}

          <button
            type="button"
            className="back-password-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <RiArrowLeftLine />
          </button>

          {/* Confirm */}

          {canContinue ? (
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          ) : (
            <button
              type="button"
              className="verify-disabled"
              disabled
            >
              Confirm
            </button>
          )}

        </div>

      </Card>
    </AuthLayout>
  );
}
