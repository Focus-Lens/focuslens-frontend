import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { useAuth } from "../context/useAuth";
import { isSetupDeferred } from "../services/setupDeferral";

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
import VerificationCodeExpired from "../pages/auth/VerificationCodeExpired";

import ChooseStart from "../pages/onboarding/ChooseStart";
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
import Plans from "../pages/dashboard/Plans";
import PurchaseCheckout from "../pages/dashboard/PurchaseCheckout";
import SecurePayment from "../pages/dashboard/SecurePayment";
import ManageSubscription, { FamilyManageSubscription } from "../pages/dashboard/ManageSubscription";
import CancelSubscription from "../pages/dashboard/CancelSubscription";
import EditBillingInformation from "../pages/dashboard/EditBillingInformation";
import ManagePaymentMethod from "../pages/dashboard/ManagePaymentMethod";
import PaymentNeedsAttention from "../pages/dashboard/PaymentNeedsAttention";
import Progress from "../pages/dashboard/Progress";
import StudyGoals from "../pages/dashboard/StudyGoals";

import Children from "../pages/dashboard/Children";
import ProfileAccount from "../pages/dashboard/ProfileAccount";
import SessionInsight from "../pages/dashboard/SessionInsight";
import Notifications from "../pages/dashboard/Notifications";
import LegalDocument from "../pages/legal/LegalDocument";
import LandingPage from "../pages/landing/LandingPage";
import LandingFaqPage from "../pages/landing/LandingFaqPage";
import LandingCompatibilityPage from "../pages/landing/LandingCompatibilityPage";
import GettingStartedGuidePage from "../pages/landing/GettingStartedGuidePage";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const deferredEmptyOverview =
    location.pathname === "/overview" && isSetupDeferred(null);
  // The stored session is available synchronously. Keep the current route on
  // screen while the background session check completes instead of replacing it
  // with a loading state on every protected-route transition.
  if (loading && isAuthenticated) return children;
  return isAuthenticated || deferredEmptyOverview
    ? children
    : <Navigate replace to="/sign-in" />;
}

function ScrollToTopOnRouteChange() {
  const { pathname, hash } = useLocation();
  const previousLocation = useRef({ pathname, hash });

  useLayoutEffect(() => {
    const previous = previousLocation.current;
    if (previous.pathname === pathname && previous.hash === hash) return;
    previousLocation.current = { pathname, hash };

    if (hash && (pathname !== previous.pathname || hash !== previous.hash)) {
      const frame = window.requestAnimationFrame(() => {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (!target) {
          window.scrollTo(0, 0);
          return;
        }
        const headerHeight = document.querySelector(".landing-header, .guide-header")?.getBoundingClientRect().height || 0;
        const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerHeight);
        window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (pathname !== previous.pathname) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/faqs" element={<LandingFaqPage />} />
        <Route path="/compatibility" element={<LandingCompatibilityPage />} />
        <Route path="/get-started-connected" element={<GettingStartedGuidePage />} />

        <Route path="/invite/:token" element={<InvitationLanding />} />
        {/* The backend's invitation email links to /invitations/parent/{token}. */}
        <Route path="/invitations/parent/:token" element={<InvitationLanding />} />
        <Route
          path="/invite/:token/continue"
          element={<ContinueInvitation />}
        />
        <Route path="/invite/continue" element={<ContinueInvitation />} />

        <Route path="/register" element={<CreateParentAccount />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/verify-email/expired"
          element={<VerificationCodeExpired />}
        />
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
        <Route path="/connect-child" element={<Navigate replace to="/choose-start" />} />
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
        <Route path="/plans" element={<RequireAuth><Plans /></RequireAuth>} />
        {import.meta.env.DEV && <Route path="/plans-preview" element={<Plans previewOnly />} />}
        <Route path="/manage-subscription" element={<RequireAuth><ManageSubscription /></RequireAuth>} />
        <Route path="/cancel-subscription" element={<RequireAuth><CancelSubscription /></RequireAuth>} />
        <Route path="/billing-information" element={<RequireAuth><EditBillingInformation /></RequireAuth>} />
        <Route path="/manage-payment-method" element={<RequireAuth><ManagePaymentMethod /></RequireAuth>} />
        <Route path="/payment-needs-attention" element={<RequireAuth><PaymentNeedsAttention /></RequireAuth>} />
        {import.meta.env.DEV && <Route path="/manage-subscription-preview" element={<ManageSubscription previewOnly />} />}
        {import.meta.env.DEV && <Route path="/manage-subscription-family-preview" element={<FamilyManageSubscription previewOnly />} />}
        {import.meta.env.DEV && <Route path="/children-preview" element={<Children previewOnly />} />}
        {import.meta.env.DEV && <Route path="/overview-preview" element={<Overview />} />}
        {import.meta.env.DEV && <Route path="/reports-preview" element={<Reports />} />}
        {import.meta.env.DEV && <Route path="/progress-child-preview" element={<Progress />} />}
        {import.meta.env.DEV && <Route path="/study-goals-preview" element={<StudyGoals />} />}
        {import.meta.env.DEV && <Route path="/cancel-subscription-preview" element={<CancelSubscription previewOnly />} />}
        {import.meta.env.DEV && <Route path="/billing-information-preview" element={<EditBillingInformation previewOnly />} />}
        {import.meta.env.DEV && <Route path="/manage-payment-method-preview" element={<ManagePaymentMethod previewOnly />} />}
        {import.meta.env.DEV && <Route path="/payment-needs-attention-preview" element={<PaymentNeedsAttention previewOnly />} />}
        <Route path="/checkout" element={<RequireAuth><PurchaseCheckout /></RequireAuth>} />
        {import.meta.env.DEV && <Route path="/checkout-preview" element={<PurchaseCheckout previewOnly />} />}
        <Route path="/checkout/payment" element={<RequireAuth><SecurePayment /></RequireAuth>} />
        {import.meta.env.DEV && <Route path="/checkout-payment-preview" element={<SecurePayment previewOnly />} />}
        {import.meta.env.DEV && <Route path="/progress-preview" element={<Progress />} />}
        <Route
          path="/reports/session/:sessionId"
          element={<RequireAuth><SessionInsight /></RequireAuth>}
        />
        <Route path="/progress" element={<RequireAuth><Progress /></RequireAuth>} />
        <Route path="/study-goals" element={<RequireAuth><StudyGoals /></RequireAuth>} />

        <Route path="/children" element={<RequireAuth><Children /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileAccount /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/privacy-policy" element={<LegalDocument type="privacy" />} />
        <Route path="/terms-of-use" element={<LegalDocument type="terms" />} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}


