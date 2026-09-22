import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import InvitationLanding from "../pages/invitation/InvitationLanding";
import ContinueInvitation from "../pages/invitation/ContinueInvitation";
import ReviewChildInvitation from "../pages/invitation/ReviewChildInvitation";

import CreateParentAccount from "../pages/auth/CreateParentAccount";
import CreatePassword from "../pages/auth/CreatePassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import AccountCreated from "../pages/auth/AccountCreated";
import SignIn from "../pages/auth/SignIn";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ForgotPasswordEmailSent from "../pages/auth/ForgotPasswordEmailSent";
import ResetPassword from "../pages/auth/ResetPassword";
import ResetPasswordSuccess from "../pages/auth/ResetPasswordSuccess";
import ResetLinkExpired from "../pages/auth/ResetLinkExpired";

import ChooseStart from "../pages/onboarding/ChooseStart";
import ConnectChild from "../pages/onboarding/ConnectChild";
import ProfileSetupChoice from "../pages/onboarding/ProfileSetupChoice";
import SendSetupLink from "../pages/onboarding/SendSetupLink";
import SetupIntro from "../pages/onboarding/SetupIntro";
import ChildBasicInfo from "../pages/onboarding/ChildBasicInfo";
import ChildStudies from "../pages/onboarding/ChildStudies";
import ChildStudyContext from "../pages/onboarding/ChildStudyContext";
import ChildStudyGoal from "../pages/onboarding/ChildStudyGoal";
import ReviewChildProfile from "../pages/onboarding/ReviewChildProfile";
import InviteChild from "../pages/onboarding/InviteChild";
import InvitationSent from "../pages/onboarding/InvitationSent";
import WaitingForChild from "../pages/onboarding/WaitingForChild";

import Overview from "../pages/dashboard/Overview";
import Reports from "../pages/dashboard/Reports";
import Progress from "../pages/dashboard/Progress";
import StudyGoals from "../pages/dashboard/StudyGoals";

import Children from "../pages/dashboard/Children";
import ProfileAccount from "../pages/dashboard/ProfileAccount";
import SessionInsight from "../pages/dashboard/SessionInsight";
import LegalDocument from "../pages/legal/LegalDocument";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // The stored session is available synchronously. Keep the current route on
  // screen while the background session check completes instead of replacing it
  // with a loading state on every protected-route transition.
  if (loading && isAuthenticated) return children;
  return isAuthenticated ? children : <Navigate replace to="/sign-in" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/sign-in" />} />

        <Route path="/invite/:token" element={<InvitationLanding />} />
        <Route
          path="/invite/:token/continue"
          element={<ContinueInvitation />}
        />
        <Route path="/invite/continue" element={<ContinueInvitation />} />

        <Route path="/register" element={<CreateParentAccount />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/account-created" element={<AccountCreated />} />

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/restore-account" element={<SignIn restoreAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/forgot-password/sent"
          element={<ForgotPasswordEmailSent />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<RequireAuth><ResetPassword /></RequireAuth>} />
        <Route
          path="/reset-password/success"
          element={<ResetPasswordSuccess />}
        />
        <Route
          path="/reset-password/expired"
          element={<ResetLinkExpired />}
        />

        <Route
          path="/review-invitation"
          element={<ReviewChildInvitation />}
        />

        <Route path="/choose-start" element={<ChooseStart />} />
        <Route path="/connect-child" element={<ConnectChild />} />
        <Route
          path="/profile-setup-choice"
          element={<ProfileSetupChoice />}
        />
        <Route path="/setup/send-link" element={<SendSetupLink />} />

        <Route path="/setup-intro" element={<SetupIntro />} />
        <Route path="/setup/basic-info" element={<ChildBasicInfo />} />
        <Route path="/setup/studies" element={<ChildStudies />} />
        <Route path="/setup/context" element={<ChildStudyContext />} />
        <Route path="/setup/goal" element={<ChildStudyGoal />} />
        <Route path="/setup/review" element={<ReviewChildProfile />} />
        <Route path="/setup/invite" element={<InviteChild />} />
        <Route
          path="/setup/invitation-sent"
          element={<InvitationSent />}
        />
        <Route path="/waiting-for-child" element={<WaitingForChild />} />

        <Route path="/overview" element={<RequireAuth><Overview /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
        <Route
          path="/reports/session/:sessionId"
          element={<RequireAuth><SessionInsight /></RequireAuth>}
        />
        <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/study-goals" element={<RequireAuth><StudyGoals /></RequireAuth>} />

        <Route path="/children" element={<RequireAuth><Children /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileAccount /></RequireAuth>} />
        <Route path="/privacy-policy" element={<RequireAuth><LegalDocument type="privacy" /></RequireAuth>} />
        <Route path="/terms-of-use" element={<RequireAuth><LegalDocument type="terms" /></RequireAuth>} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
