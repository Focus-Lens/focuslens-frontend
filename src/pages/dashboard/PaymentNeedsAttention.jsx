import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readActiveSubscription } from "../../data/subscriptionPlans";
import "../../css/dashboard/PaymentNeedsAttention.css";

export default function PaymentNeedsAttention({ previewOnly = false }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const subscription = useMemo(() => previewOnly ? null : readActiveSubscription(user), [previewOnly, user]);
  const requestedPlanId = params.get("plan") || subscription?.planId || "plus";
  const plan = planCatalog.find((item) => item.id === requestedPlanId) || planCatalog[1];
  const activePlan = planCatalog.find((item) => item.id === subscription?.planId) || plan;
  const displayPlan = previewOnly ? plan : activePlan;
  const billingCycle = subscription?.billingCycle === "yearly" ? "yearly" : "monthly";
  const price = getPlanPrice(displayPlan, billingCycle);
  const paymentBrand = subscription?.paymentBrand || "Visa";
  const lastFour = subscription?.lastFour || "4242";
  const billingPath = previewOnly
    ? (plan.id === "family" ? "/manage-subscription-family-preview" : "/manage-subscription-preview")
    : "/manage-subscription";
  const paymentPath = previewOnly
    ? `/manage-payment-method-preview?plan=${plan.id}`
    : `/manage-payment-method?plan=${displayPlan.id}`;
  const previewData = previewOnly ? {
    previewOnly: true,
    subscription: { planId: plan.id, billingCycle, status: "active" },
    parent: { firstName: "Mariam", lastName: "Hassan", email: dashboardMockData.profile.email },
    child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
  } : null;

  return (
    <div className="payment-attention-shell">
      <DashboardHeader activePage="payment" previewData={previewData} />
      <main className="payment-attention-page">
        <header className="payment-attention-heading">
          <h1>Payment needs attention</h1>
          <p>Subscription payment status</p>
        </header>

        <section className="payment-attention-card" aria-labelledby="payment-attention-title">
          <span className="payment-past-due-badge">Past due</span>
          <h2 id="payment-attention-title">Your payment is past due</h2>
          <p className="payment-attention-description">We couldn’t confirm your latest renewal payment. Review your payment method to restore billing.</p>

          <dl className="payment-attention-facts">
            <div><dt>Plan</dt><dd>{displayPlan.name} · {price.toLocaleString("en-US")} EGP / {billingCycle === "yearly" ? "year" : "month"}</dd></div>
            <div><dt>Payment method</dt><dd>{paymentBrand} ending in {lastFour}</dd></div>
          </dl>

          {displayPlan.id === "family" && (
            <aside className="payment-family-warning">
              <strong>If Family access ends</strong>
              <span>You will be asked to choose one child to keep connected. Other connections are paused and their history is preserved.</span>
            </aside>
          )}

          <div className="payment-attention-actions">
            <Link className="payment-attention-back" to={billingPath}>Back to billing</Link>
            <Link className="payment-attention-resolve" to={paymentPath}>Resolve payment</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
