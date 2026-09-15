import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card, Field } from "../../components/ui/CommonUI";
import { resolveParentInvitation } from "../../services/access";
import { ApiError } from "../../services/apiClient";

export default function ConnectChild() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleContinue() {
    if (!code.trim()) {
      setError("Enter the private connection code your child shared.");
      return;
    }

    setError("");

    try {
      await resolveParentInvitation(code.trim());
      sessionStorage.setItem("pendingInvitationToken", code.trim());
      navigate("/review-invitation");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "This code doesn't seem to be valid. Please check it and try again."
      );
    }
  }

  return (
    <AuthLayout>
      <Card title="Connect with your child">
        <p>
          Enter the private code shown in your child’s FocusLens student app.
        </p>

        <Field
          label="Private invitation code"
          placeholder="Ask your child for their private connection code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />

        {error && <p className="password-error">{error}</p>}

        <Button onClick={handleContinue}>Continue</Button>

        <p className="hint">
          For privacy, FocusLens does not offer public student search by name,
          school, email, or location.
        </p>
      </Card>
    </AuthLayout>
  );
}
