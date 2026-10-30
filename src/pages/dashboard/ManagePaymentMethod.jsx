import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readActiveSubscription } from "../../data/subscriptionPlans";
import "../../css/dashboard/ManagePaymentMethod.css";

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default function ManagePaymentMethod({ previewOnly = false }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const subscription = useMemo(() => previewOnly ? null : readActiveSubscription(user), [previewOnly, user]);
  const requestedPlanId = params.get("plan") || subscription?.planId || "plus";
  const plan = planCatalog.find((item) => item.id === requestedPlanId) || planCatalog[1];
  const activePlan = planCatalog.find((item) => item.id === subscription?.planId) || plan;
  const billingPlan = previewOnly ? plan : activePlan;
  const billingCycle = subscription?.billingCycle === "yearly" ? "yearly" : "monthly";
  const price = getPlanPrice(billingPlan, billingCycle);
  const paymentBrand = subscription?.paymentBrand || "Visa";
  const lastFour = subscription?.lastFour || "4242";
  const cardExpiry = subscription?.cardExpiry || "08/2028";
  const paidAt = subscription?.paidAt || "2026-10-20T12:00:00.000Z";
  const returnPath = previewOnly
    ? (plan.id === "family" ? "/manage-subscription-family-preview" : "/manage-subscription-preview")
    : "/manage-subscription";
  const securePaymentPath = `${previewOnly ? "/checkout-payment-preview" : "/checkout/payment"}?plan=${plan.id}&cycle=${billingCycle}&from=manage-payment`;
  const previewData = previewOnly ? {
    previewOnly: true,
    subscription: { planId: plan.id, billingCycle, status: "active" },
    parent: { firstName: "Mariam", lastName: "Hassan", email: dashboardMockData.profile.email },
    child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
  } : null;

  return (
    <div className="manage-payment-shell">
      <DashboardHeader activePage="payment" previewData={previewData} />
      <main className="manage-payment-page">
        <header className="manage-payment-heading">
          <h1>Manage payment method</h1>
          <p>Review how your subscription was paid.</p>
        </header>

        <section className="manage-payment-card" aria-labelledby="last-payment-title">
          <h2 id="last-payment-title">Last successful payment</h2>
          <dl className="manage-payment-facts">
            <div><dt>Method</dt><dd>{paymentBrand} ending in {lastFour}</dd></div>
            <div><dt>Card expiry</dt><dd>{cardExpiry}</dd></div>
            <div><dt>Paid on</dt><dd>{formatDate(paidAt)}</dd></div>
            <div><dt>Amount</dt><dd>{price.toLocaleString("en-US")} EGP</dd></div>
          </dl>

          <aside className="manage-payment-notice">
            <strong>Change your method securely</strong>
            <span>Continue to the payment provider to view available cards and mobile wallets. FocusLens only displays masked payment details.</span>
          </aside>

          <p className="manage-payment-footnote">If this payment method cannot be reused, the provider will ask you to authorize the next payment.</p>

          <div className="manage-payment-actions">
            <Link className="manage-payment-back" to={returnPath}>Back to billing</Link>
            <Link className="manage-payment-continue" to={securePaymentPath}>Continue securely</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
