import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readActiveSubscription, updateActiveSubscription } from "../../data/subscriptionPlans";
import { readBillingContact } from "../../data/billingContact";
import { findConnectedChild, getCachedParentChildren } from "../../services/parentChildrenCache";
import { getStudentDisplayName } from "../../services/studentDisplayName";
import "../../css/dashboard/ManageSubscription.css";

const previewSubscriptions = {
  plus: {
    planId: "plus",
    billingCycle: "monthly",
    status: "active",
    paidAt: "2026-10-20T12:00:00.000Z",
    nextRenewalAt: "2026-11-20T12:00:00.000Z",
    lastFour: "4242",
    paymentBrand: "Visa",
    cardExpiry: "08/2028",
    childUsage: [{ id: "youssef", name: "Youssef", sessionsRemaining: 38, creditsRemaining: 132 }],
  },
  family: {
    planId: "family",
    billingCycle: "monthly",
    status: "active",
    paidAt: "2026-10-20T12:00:00.000Z",
    nextRenewalAt: "2026-11-20T12:00:00.000Z",
    lastFour: "4242",
    paymentBrand: "Visa",
    cardExpiry: "08/2028",
    childUsage: [
      { id: "preview-youssef", name: "Youssef", preferredName: "Youssef", grade: "Grade 10", status: "active", sessionsRemaining: 38, creditsRemaining: 132 },
      { id: "preview-salma", name: "Salma", preferredName: "Salma", grade: "Grade 8", status: "active", sessionsRemaining: 38, creditsRemaining: 132 },
      { id: "preview-omar", name: "Omar", preferredName: "Omar", grade: "Grade 5", status: "active", sessionsRemaining: 38, creditsRemaining: 132 },
    ],
  },
};

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function getRenewalDate(subscription) {
  if (subscription.nextRenewalAt) return subscription.nextRenewalAt;
  const date = new Date(subscription.paidAt || Date.now());
  if (subscription.billingCycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

export default function ManageSubscription({ previewOnly = false, previewPlanId = "plus" }) {
  const { user } = useAuth();
  const previewSubscription = previewSubscriptions[previewPlanId] || previewSubscriptions.plus;
  const [subscription, setSubscription] = useState(() => (
    previewOnly ? previewSubscription : readActiveSubscription(user)
  ));
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const plan = planCatalog.find((item) => item.id === subscription?.planId) || planCatalog[1];
  const billingCycle = subscription?.billingCycle === "yearly" ? "yearly" : "monthly";
  const price = getPlanPrice(plan, billingCycle);
  const renewalDate = getRenewalDate(subscription || {});
  const cachedChild = findConnectedChild(getCachedParentChildren());
  const previewData = previewOnly
    ? {
        previewOnly: true,
        subscription: previewSubscription,
        parent: {
          firstName: dashboardMockData.profile.fullName.split(/\s+/)[0],
          lastName: "Hassan",
          email: dashboardMockData.profile.email,
          city: "Cairo",
          country: "Egypt",
        },
        child: { preferredName: dashboardMockData.child.preferredName, grade: "Grade 10" },
      }
    : null;
  const childName = getStudentDisplayName(previewData?.child || cachedChild, "Your child");
  const sessionsIncluded = plan.id === "family" ? 50 : plan.id === "plus" ? 50 : 10;
  const creditsIncluded = plan.id === "family" ? 180 : plan.id === "plus" ? 180 : 30;
  const usageCards = subscription.childUsage?.length
    ? subscription.childUsage
    : [{ id: cachedChild?.studentId || "child", name: childName, status: "active" }];
  const connectedSlots = subscription.connectedChildren ?? usageCards.length;
  const childSlotLimit = subscription.childLimit ?? (plan.id === "family" ? 3 : 1);
  const displayParent = previewData?.parent || user || {};
  const billingContact = readBillingContact({
    fullName: `${displayParent.firstName || ""} ${displayParent.lastName || ""}`.trim() || "Parent account",
    email: displayParent.email || "",
    city: displayParent.city || "",
    country: displayParent.country || "",
  });
  const parentName = billingContact.fullName;
  const email = billingContact.email;
  const location = [billingContact.city, billingContact.country].filter(Boolean).join(", ");
  const planSubtitle = plan.id === "family"
    ? "Plus features for up to three connected children."
    : "Plus learning support for one connected child.";

  function scheduleCancellation() {
    if (!previewOnly) updateActiveSubscription({ cancelAtPeriodEnd: true });
    setSubscription((current) => ({ ...current, cancelAtPeriodEnd: true }));
    setShowCancelConfirm(false);
    setNotice(`Your subscription will remain active until ${formatDate(renewalDate)}.`);
  }

  if (!subscription) {
    return (
      <div className="manage-subscription-shell">
        <DashboardHeader activePage="payment" />
        <main className="manage-subscription-page manage-subscription-empty">
          <h1>No active subscription</h1>
          <p>Choose a plan to manage your subscription and billing details.</p>
          <Link className="manage-primary-button" to="/plans">Explore plans</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="manage-subscription-shell">
      <DashboardHeader activePage="payment" previewData={previewData} />
      <main className="manage-subscription-page">
        <header className="manage-subscription-heading">
          <h1>Plan &amp; billing — {plan.name}</h1>
          <p>Your subscription, payment details and child allowances in one place.</p>
        </header>

        {notice && <p className="manage-subscription-notice" role="status">{notice}</p>}

        <div className="manage-subscription-grid">
          <div className="manage-left-stack">
          <section className="manage-card current-plan-card" aria-labelledby="current-plan-title">
            <div className="manage-card-title-row">
              <h2 id="current-plan-title">FocusLens {plan.name}</h2>
              <span className={`manage-status-badge${subscription.cancelAtPeriodEnd ? " scheduled" : ""}`}>
                {subscription.cancelAtPeriodEnd ? "Cancels soon" : "Active"}
              </span>
            </div>
            <div className="manage-plan-price"><strong>{price.toLocaleString("en-US")} EGP</strong><span>/ {billingCycle === "yearly" ? "year" : "month"}</span></div>
            <p className="manage-plan-subtitle">{planSubtitle}</p>
            <div className="manage-plan-facts">
              <div><span>Billing cycle</span><strong>{billingCycle === "yearly" ? "Yearly" : "Monthly"}</strong></div>
              <div><span>Next renewal</span><strong>{subscription.cancelAtPeriodEnd ? "No renewal" : formatDate(renewalDate)}</strong></div>
              <div><span>Next payment</span><strong>{subscription.cancelAtPeriodEnd ? "—" : `${price.toLocaleString("en-US")} EGP`}</strong></div>
            </div>
            <p className="manage-plan-allowance">{sessionsIncluded} sessions {plan.id === "family" ? "+" : "·"} {creditsIncluded} AI credits {plan.id === "family" ? "per child " : ""}each billing month</p>
            <div className="manage-plan-actions">
              {plan.id === "family"
                ? <Link className="manage-primary-button" to={previewOnly ? "/plans-preview?change=1&from=family" : "/plans?change=1&from=family"}>Change plan</Link>
                : <Link className="manage-primary-button" to={previewOnly ? "/plans-preview?change=1&from=plus" : "/plans?change=1&from=plus"}>Upgrade to Family</Link>}
              {!subscription.cancelAtPeriodEnd && (plan.id === "family"
                ? <Link className="manage-secondary-button" to={previewOnly ? "/cancel-subscription-preview?plan=family" : "/cancel-subscription"}>Cancel subscription</Link>
                : <button className="manage-secondary-button" type="button" onClick={() => setShowCancelConfirm(true)}>Cancel subscription</button>)}
            </div>
          </section>

          {plan.id === "plus" ? (
            <aside className="manage-family-callout"><strong>Room for the whole family</strong><span>Family includes Plus for up to 3 children, with separate usage and analytics.</span></aside>
          ) : (
            <aside className="manage-family-callout family-slots-callout">
              <div><strong>{connectedSlots} of {childSlotLimit} child slots connected</strong><span>{usageCards.map((item) => item.name).join(", ")} each have their own analytics and allowances.</span></div>
              <Link className="manage-soft-button" to={previewOnly ? "/children-preview" : "/children"}>Manage children</Link>
            </aside>
          )}
          </div>

          <div className="manage-side-stack">
            <section className="manage-card payment-method-card" aria-labelledby="payment-method-title">
              <div className="manage-card-title-row"><h2 id="payment-method-title">Payment method</h2><span className="manage-status-badge">Paid</span></div>
              <strong>{subscription.paymentBrand || "Visa"} ending in {subscription.lastFour || "4242"}</strong>
              <p>Credit / debit card{subscription.cardExpiry ? ` · Expires ${subscription.cardExpiry}` : ""}</p>
              <div className="manage-last-payment"><span>Last payment</span><strong>{price.toLocaleString("en-US")} EGP · {formatDate(subscription.paidAt || renewalDate)}</strong></div>
              <Link className="manage-soft-button" to={previewOnly ? `/manage-payment-method-preview?plan=${plan.id}` : `/manage-payment-method?plan=${plan.id}`}>Manage payment method</Link>
            </section>

            <section className="manage-card billing-info-card" aria-labelledby="billing-info-title">
              <div className="manage-card-title-row"><h2 id="billing-info-title">Billing information</h2><Link className="manage-edit-button" to={previewOnly ? `/billing-information-preview?plan=${plan.id}` : `/billing-information?plan=${plan.id}`}>Edit</Link></div>
              <strong>{parentName}</strong>
              {email && <p>{email}</p>}
              {location && <p>{location}</p>}
              {billingContact.address && <p>{billingContact.address}</p>}
              <small>Used for payment receipts and billing contact.</small>
            </section>
          </div>
        </div>

        <section className="manage-card usage-card" aria-labelledby="usage-title">
          <div className="manage-card-title-row"><h2 id="usage-title">Usage this billing month</h2><span className="manage-reset-badge">Resets {formatDate(renewalDate)}</span></div>
          <p>{plan.id === "family" ? "Each child has their own allowance. Sessions and AI credits reset each billing month." : "Your child’s sessions and AI credits reset each billing month."}</p>
          <div className={`manage-usage-children${plan.id === "family" ? " family-usage-children" : ""}`}>
            {usageCards.map((item) => {
              const sessionsRemaining = Math.min(item.sessionsRemaining ?? sessionsIncluded, sessionsIncluded);
              const creditsRemaining = Math.min(item.creditsRemaining ?? creditsIncluded, creditsIncluded);
              const sessionUsedPercent = Math.round(((sessionsIncluded - sessionsRemaining) / sessionsIncluded) * 100);
              const creditUsedPercent = Math.round(((creditsIncluded - creditsRemaining) / creditsIncluded) * 100);
              return (
                <div className="manage-usage-child" key={item.id || item.name}>
                  <div className="manage-usage-child-heading"><strong>{item.name || childName}</strong><span className="manage-status-badge">{item.status || "Active"}</span></div>
                  <div className="manage-meter-label"><span>Study sessions</span><strong>{sessionsRemaining} / {sessionsIncluded} left</strong></div>
                  <div className="manage-meter"><span style={{ width: `${sessionUsedPercent}%` }} /></div>
                  <div className="manage-meter-label"><span>AI credits</span><strong>{creditsRemaining} / {creditsIncluded} left</strong></div>
                  <div className="manage-meter"><span style={{ width: `${creditUsedPercent}%` }} /></div>
                  <small>{formatDate(subscription.paidAt || renewalDate)} – {formatDate(renewalDate)}</small>
                </div>
              );
            })}
          </div>
          <small className="manage-usage-footnote">Credits do not roll over. A non-AI session remains available while sessions are left.</small>
        </section>
      </main>

      {showCancelConfirm && (
        <div className="manage-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCancelConfirm(false); }}>
          <section className="manage-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title">
            <button className="manage-modal-close" type="button" aria-label="Close" onClick={() => setShowCancelConfirm(false)}><X size={18} /></button>
            <h2 id="cancel-subscription-title">Cancel subscription?</h2>
            <p>Your Plus plan will stay active until {formatDate(renewalDate)}. It won’t renew after that date.</p>
            <div className="manage-modal-actions"><button className="manage-secondary-button" type="button" onClick={() => setShowCancelConfirm(false)}>Keep subscription</button><button className="manage-danger-button" type="button" onClick={scheduleCancellation}>Confirm cancellation</button></div>
          </section>
        </div>
      )}

    </div>
  );
}

export function FamilyManageSubscription({ previewOnly = false }) {
  return <ManageSubscription previewOnly={previewOnly} previewPlanId="family" />;
}
