import { AuthLayout, Button } from "../../components/ui/CommonUI";
import { child } from "../../data/mockData";
import "../../css/invitation/ContinueInvitation.css";

export default function ContinueInvitation() {
  const previewRaw = sessionStorage.getItem("pendingInvitationPreview");
  const preview = previewRaw ? JSON.parse(previewRaw) : null;
  const childName = preview?.studentPreferredName ?? child.preferredName;

  return (
    <AuthLayout hideFooter>
      <section className="invitation-landing-main">
        <section className="continue-invitation-card">
          <h1>How would you like to continue?</h1>

          <p>
  {childName}’s invitation will stay attached while you create or
  <br />
  sign in to your parent account.
</p>

          <div className="actions">
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
