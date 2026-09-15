import { useNavigate } from "react-router-dom";
import { AuthLayout, Button, Card } from "../../components/ui/CommonUI";
import { useAuth } from "../../context/AuthContext";

export default function AccountCreated() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  function handleDoThisLater() {
    setUser((current) => (current ? { ...current, hasChild: false } : current));
    navigate("/overview");
  }

  return (
    <AuthLayout hideFooter>
  <div className="account-created-wrapper">
    <Card>
      <div className="account-created-page">

        <div className="account-created-logo">
          <img
            src="/public/images/Focuslens logo animation - success 2.png"
            alt="FocusLens"
          />
        </div>

        <h1 className="account-created-title">
          Your parent account has been created
        </h1>

        <p className="account-created-subtitle">
          Now choose how you’d like to connect with your child.
        </p>

        <div className="account-created-actions">
          <Button to="/choose-start">
            Continue
          </Button>

          <Button
            secondary
            onClick={handleDoThisLater}
          >
            Do this later
          </Button>
        </div>

      </div>
    </Card>
  </div>
</AuthLayout>
  );
}
