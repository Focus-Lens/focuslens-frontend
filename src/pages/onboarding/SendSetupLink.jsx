import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Field,
  Card,
  AuthLayout,
} from "../../components/ui/CommonUI";
import { RiArrowLeftLine } from "react-icons/ri";
import { child } from "../../data/mockData";
import "../../css/onboarding/SendSetupLink.css";

export default function SendSetupLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nextStep =
    searchParams.get("next") === "setup-intro"
      ? "/setup-intro"
      : "/overview";

  const [link] = useState(
    `https://focuslens.app/setup/${encodeURIComponent(
      child.preferredName || "demo"
    )}`
  );

  async function handleCopy() {
    await navigator.clipboard?.writeText(link).catch(() => {});
    navigate(nextStep);
  }

  return (
    <AuthLayout hideFooter>
      <div className="send-setup-link-wrapper">
        <Card>
          <div className="send-setup-link-page">

            <h1 className="send-setup-link-title">
              Send your child a setup link
            </h1>

            <p className="send-setup-link-subtitle">
              Your invitation will be attached automatically.
            </p>

            <p className="send-setup-link-heading">
              Share a private profile setup link
            </p>

            <Field
              label="Private profile setup link"
              value={link}
              readOnly
              className="setup-link-field"
            />

            <p className="send-setup-link-hint">
              Share only with your child; the link includes your invitation.
            </p>

            <div className="send-setup-link-notice">
              <b>Your child stays in control</b>

              <p>
                They’ll create their own profile, see who invited them, and
                choose whether to activate the invitation.
              </p>

              <p>
                You won’t see study data before activation and sharing approval.
              </p>
            </div>

            <div className="send-setup-link-actions">

              <button
                type="button"
                className="send-setup-link-back"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <RiArrowLeftLine />
              </button>

              <Button onClick={handleCopy}>Copy setup link</Button>

            </div>

            <p className="send-setup-link-expiry">
              Expires 7 days after creation. You can cancel it from the dashboard.
            </p>

          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
