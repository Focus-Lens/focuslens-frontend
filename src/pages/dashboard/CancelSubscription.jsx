import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import DashboardHeader from "../../components/ui/DashboardHeader";
import { useAuth } from "../../context/useAuth";
import { dashboardMockData } from "../../data/mockData";
import { getPlanPrice, planCatalog, readActiveSubscription, updateActiveSubscription } from "../../data/subscriptionPlans";
import { getCachedParentChildren } from "../../services/parentChildrenCache";
import { getStudentDisplayName } from "../../services/studentDisplayName";
import "../../css/dashboard/CancelSubscription.css";

const previewPlans = {
  plus: { planId: "plus", billingCycle: "monthly", nextRenewalAt: "2026-11-20T12:00:00.000Z", childUsage: [{ id: "youssef", name: "Youssef" }] },
  family: { planId: "family", billingCycle: "monthly", nextRenewalAt: "2026-11-20T12:00:00.000Z", childUsage: [{ id: "youssef", name: "Youssef" }, { id: "salma", name: "Salma" }, { id: "omar", name: "Omar" }] },
};

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "20 Nov 2026" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function CancelSubscription({ previewOnly = false }) {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const planId = previewOnly ? (params.get("plan") === "family" ? "family" : "plus") : null;
  const subscription = useMemo(() => previewOnly ? previewPlans[planId] : (location.state?.subscription || readActiveSubscription(user)), [previewOnly, planId, location.state, user]);
  const plan = planCatalog.find((item) => item.id === (subscription?.planId || planId)) || planCatalog[1];
  const isFamily = plan.id === "family";
  const currentPlanPrice = getPlanPrice(plan, subscription?.billingCycle === "yearly" ? "yearly" : "monthly");
  const renewalDate = formatDate(subscription?.nextRenewalAt);
  const renewalDateShort = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(subscription?.nextRenewalAt || "2026-11-20T12:00:00.000Z"));
  const cachedChildren = getCachedParentChildren() || [];
  const childList = subscription?.childUsage?.length ? subscription.childUsage : cachedChildren;
  const choosingChild = params.get("step") === "choose-child";
  const [selectedChild, setSelectedChild] = useState(() => params.get("child") || "");
  const completed = params.get("step") === "scheduled" || Boolean(subscription?.cancelAtPeriodEnd && subscription?.pendingPlanId === "free");
  const children = childList.length ? childList : [{ id: "youssef", name: getStudentDisplayName(dashboardMockData.child, "Youssef") }];
  const retainedChild = children.find((child, index) => String(child.id || child.studentId || index) === selectedChild) || children[0];
  const retainedChildName = retainedChild?.name || getStudentDisplayName(retainedChild, "Your child");
  const headerPreview = previewOnly ? { previewOnly: true, subscription, parent: { firstName: "Mariam", lastName: "Hassan", email: dashboardMockData.profile.email }, child: { preferredName: "Youssef", grade: "Grade 10" } } : null;
  const returnPath = previewOnly
    ? (isFamily ? "/manage-subscription-family-preview" : "/manage-subscription-preview")
    : "/manage-subscription";
  const cancelPath = previewOnly ? "/cancel-subscription-preview?plan=family" : "/cancel-subscription";
  const scheduledPath = previewOnly
    ? `/cancel-subscription-preview?plan=family&step=scheduled&child=${encodeURIComponent(selectedChild)}`
    : `/cancel-subscription?step=scheduled&child=${encodeURIComponent(selectedChild)}`;

  function confirmCancellation() {
    if (!previewOnly) updateActiveSubscription({
      cancelAtPeriodEnd: true,
      pendingPlanId: "free",
      pendingEffectiveAt: subscription?.nextRenewalAt || subscription?.paidAt,
      pendingRetainedChildId: selectedChild,
    });
    navigate(scheduledPath, { replace: true });
  }

  function resumeFamily() {
    if (!previewOnly) updateActiveSubscription({
      cancelAtPeriodEnd: false,
      pendingPlanId: null,
      pendingEffectiveAt: null,
      pendingRetainedChildId: null,
    });
    navigate(returnPath, { replace: true });
  }

  return (
    <div className="cancel-subscription-shell">
      <DashboardHeader activePage="payment" previewData={headerPreview} />
      <main className={`cancel-subscription-page${choosingChild ? " is-choosing-child" : ""}${completed ? " is-cancellation-complete" : ""}`}>
        <header className="cancel-subscription-heading">
          <h1>{completed ? `Cancellation scheduled — ${retainedChildName}` : choosingChild ? "Choose one child" : `Cancel ${plan.name} subscription`}</h1>
          <p>{completed ? "Your plan change has been saved." : choosingChild ? "One choice now. Your other connections stay safe." : "Review what changes before continuing."}</p>
        </header>

        <section className="cancel-review-card">
          {completed ? (
            <>
              <span className="cancel-change-badge">Change scheduled</span>
              <h2>Family stays active until {renewalDateShort}</h2>
              <p>On {renewalDate}, your account moves to Free. {retainedChildName} stays connected. The other {Math.max(children.length - 1, 0)} connections pause without deleting their history.</p>
              <dl className="cancel-plan-facts completed-plan-facts">
                <div><dt>Current plan</dt><dd>{plan.name} · {currentPlanPrice.toLocaleString("en-US")} EGP / {subscription?.billingCycle === "yearly" ? "year" : "month"}</dd></div>
                <div><dt>Upcoming plan</dt><dd>Free · 0 EGP</dd></div>
                <div><dt>Child staying connected</dt><dd>{retainedChildName}</dd></div>
                <div><dt>Effective date</dt><dd>{renewalDate}</dd></div>
              </dl>
              <div className="cancel-resume-notice">
                <strong>Changed your mind?</strong>
                <span>Resume Family before the effective date to keep all three connections active.</span>
              </div>
              <div className="cancel-review-actions">
                <Link className="cancel-secondary-button" to={returnPath}>Back to billing</Link>
                <button className="cancel-primary-button" type="button" onClick={resumeFamily}>Resume Family</button>
              </div>
            </>
          ) : choosingChild ? (
            <>
              <span className="cancel-effective-badge">Effective {renewalDate}</span>
              <h2>Who stays connected on Free?</h2>
              <p>Choose one of your connected children. All three connections stay active until {renewalDate}. No child is selected automatically.</p>
              <div className="cancel-child-options">
                {children.map((child, index) => {
                  const id = String(child.id || child.studentId || index);
                  return <label className={`cancel-child-option${selectedChild === id ? " selected" : ""}`} key={id}>
                    <input type="radio" name="retained-child" value={id} checked={selectedChild === id} onChange={() => setSelectedChild(id)} />
                    <span className="cancel-child-copy"><strong>{child.name || getStudentDisplayName(child, `Child ${index + 1}`)}</strong><small>Approved child connection</small></span>
                    <span className={`cancel-connected-badge${selectedChild === id ? " keep-connected-badge" : ""}`}>{selectedChild === id ? "Keep connected" : "Connected"}</span>
                  </label>;
                })}
              </div>
              <div className="cancel-data-notice">
                <strong>What happens to the other connections?</strong>
                <span>They become paused on {renewalDate}. Their relationship and historical data remain stored. Parent dashboard access returns when Family is restored.</span>
              </div>
              {selectedChild && <p className="cancel-selection-summary">
                {children.find((child, index) => String(child.id || child.studentId || index) === selectedChild)?.name || "Selected child"} stays active · {children.filter((child, index) => String(child.id || child.studentId || index) !== selectedChild).map((child, index) => child.name || getStudentDisplayName(child, `Child ${index + 1}`)).join(" and ")} will be paused.
              </p>}
              <div className="cancel-review-actions">
                <button className="cancel-secondary-button cancel-step-back" type="button" onClick={() => navigate(cancelPath)}>Back</button>
                <button className="cancel-primary-button cancel-step-continue" type="button" onClick={confirmCancellation} disabled={!selectedChild}>{selectedChild ? "Confirm switch to Free" : "Select one child to continue"}</button>
              </div>
            </>
          ) : (
            <>
              <span className="cancel-effective-badge">Effective {renewalDate}</span>
              <h2>{isFamily ? "Keep one child connected on Free" : "Keep your child connected on Free"}</h2>
              <p>{isFamily
                ? `You have ${children.length} children connected. Free supports one active child connection. In the next step, choose who stays connected.`
                : "Free supports one active child connection. Your child will stay connected with the Free plan."}</p>
              {isFamily && <div className="cancel-data-notice">
                <strong>Your children's data stays safe</strong>
                <span>The other two parent connections will be paused, not deleted. You will lose dashboard access to their data until Family is restored.</span>
              </div>}
              <dl className="cancel-plan-facts">
                <div><dt>Plan after cancellation</dt><dd>Free · 0 EGP</dd></div>
                <div><dt>Allowance on Free</dt><dd>10 sessions + 30 AI credits / month</dd></div>
                <div><dt>Access until</dt><dd>{renewalDate}</dd></div>
              </dl>
              <p className="cancel-feature-note">Weekly missions, full achievements, and mascot levels 4–5 will no longer be available.</p>
              <div className="cancel-review-actions">
                <Link className={`cancel-secondary-button${isFamily ? " keep-family-button" : ""}`} to={returnPath}>{isFamily ? "Keep Family" : "Keep Plus"}</Link>
                {isFamily
                  ? <button className="cancel-primary-button" type="button" onClick={() => navigate(`${cancelPath}&step=choose-child`)}>Choose a child</button>
                  : <button className="cancel-primary-button" type="button" onClick={confirmCancellation}>Confirm cancellation</button>}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
