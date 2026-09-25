import { AuthLayout, Button } from "../../components/ui/CommonUI";
import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { resolveAccessInvitation } from "../../services/api";
import "../../css/invitation/ContinueInvitation.css";

export default function ContinueInvitation() {
  const { token: routeToken } = useParams();
  const token = routeToken || sessionStorage.getItem("pendingInvitationToken");
  const location = useLocation();
  const [name, setName] = useState(() => token
    ? location.state?.invitationName || sessionStorage.getItem("pendingInvitationName") || ""
    : "");
  useEffect(() => {
    if (!token) return;
    sessionStorage.setItem("pendingInvitationToken", token);
    resolveAccessInvitation(token)
      .then((data) => {
        sessionStorage.setItem("pendingInvitationName", data.studentPreferredName);
        setName(data.studentPreferredName);
      }).catch(() => {});
  }, [token]);
  return (
    <AuthLayout hideFooter>
      <section className="invitation-landing-main">
        <section className="continue-invitation-card">
          <h1>How would you like to continue?</h1>

          <p>
            {token
              ? `${name || "Your child"}’s invitation will stay attached while you create or sign in to your parent account.`
              : "Create or sign in to your parent account to get started."}
          </p>

          <div className="continue-invitation-actions">
            <div className="continue-invitation-button1">
              <Button to="/register">Create a parent account</Button>
            </div>

            <div className="continue-invitation-button2">
              <Button secondary to="/sign-in">
                Sign in
              </Button>
            </div>
          </div>
        </section>
      </section>
    </AuthLayout>
  );
}
