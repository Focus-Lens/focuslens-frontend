import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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
import Notifications from "../pages/dashboard/Notifications";
import ProfileAccount from "../pages/dashboard/ProfileAccount";
import SessionInsight from "../pages/dashboard/SessionInsight";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InvitationLanding />} />

        <Route path="/invite/:token" element={<InvitationLanding />} />
        <Route
          path="/invite/:token/continue"
          element={<ContinueInvitation />}
        />

        <Route path="/register" element={<CreateParentAccount />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/account-created" element={<AccountCreated />} />

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/forgot-password/sent"
          element={<ForgotPasswordEmailSent />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
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
          element={
            <ProtectedRoute>
              <ReviewChildInvitation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/choose-start"
          element={
            <ProtectedRoute>
              <ChooseStart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connect-child"
          element={
            <ProtectedRoute>
              <ConnectChild />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-setup-choice"
          element={
            <ProtectedRoute>
              <ProfileSetupChoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/send-link"
          element={
            <ProtectedRoute>
              <SendSetupLink />
            </ProtectedRoute>
          }
        />

        <Route
          path="/setup-intro"
          element={
            <ProtectedRoute>
              <SetupIntro />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/basic-info"
          element={
            <ProtectedRoute>
              <ChildBasicInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/studies"
          element={
            <ProtectedRoute>
              <ChildStudies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/context"
          element={
            <ProtectedRoute>
              <ChildStudyContext />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/goal"
          element={
            <ProtectedRoute>
              <ChildStudyGoal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/review"
          element={
            <ProtectedRoute>
              <ReviewChildProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/invite"
          element={
            <ProtectedRoute>
              <InviteChild />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/invitation-sent"
          element={
            <ProtectedRoute>
              <InvitationSent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waiting-for-child"
          element={
            <ProtectedRoute>
              <WaitingForChild />
            </ProtectedRoute>
          }
        />

        <Route
          path="/overview"
          element={
            <ProtectedRoute>
              <Overview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/session/:sessionId"
          element={
            <ProtectedRoute>
              <SessionInsight />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-goals"
          element={
            <ProtectedRoute>
              <StudyGoals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/children"
          element={
            <ProtectedRoute>
              <Children />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileAccount />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
