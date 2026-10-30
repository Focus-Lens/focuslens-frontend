export const planCatalog = [
  {
    id: "free",
    name: "Free",
    audience: "For light users",
    monthlyPrice: 0,
    features: ["1 connected child", "10 study sessions per month", "30 AI credits per month", "Core gamification", "One-child parent dashboard"],
  },
  {
    id: "plus",
    name: "Plus",
    audience: "For focused learners",
    monthlyPrice: 149,
    features: ["1 connected child", "50 study sessions per month", "180 AI credits per month", "Weekly missions", "Full achievements", "Mascot levels 1 – 5"],
  },
  {
    id: "family",
    name: "Family",
    audience: "For the whole family",
    monthlyPrice: 299,
    recommended: true,
    features: ["Up to 3 connected children", "50 study sessions per child per month", "180 AI credits per child per month", "Separate analytics for each child", "Family management + child switcher"],
  },
];

export const planSelectionStorageKey = "focuslensPlanSelection.v2";
export const activeSubscriptionStorageKey = "focuslensActiveSubscription.v1";

export function getPlanPrice(plan, billingCycle) {
  if (billingCycle !== "yearly") return plan.monthlyPrice;
  const yearlyPrices = { free: 0, plus: 1199, family: 2990 };
  return yearlyPrices[plan.id] ?? Math.round(plan.monthlyPrice * 12 * 0.8);
}

export function readPlanSelection() {
  try {
    const value = JSON.parse(sessionStorage.getItem(planSelectionStorageKey));
    if (!value?.planId || !["monthly", "yearly"].includes(value.billingCycle)) return null;
    return value;
  } catch {
    return null;
  }
}

export function readActiveSubscription(user = null) {
  try {
    const stored = JSON.parse(localStorage.getItem(activeSubscriptionStorageKey));
    if (isActivePaidPlan(stored)) return stored;
  } catch {
    // Ignore unavailable or malformed local subscription data.
  }

  const candidates = [
    user?.subscription,
    user?.activeSubscription,
    user?.currentSubscription,
    user?.plan && typeof user.plan === "object" ? user.plan : null,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const rawPlanId = candidate.planId || candidate.plan?.id || candidate.plan?.slug || candidate.id || candidate.slug;
    const planId = findPlanId(rawPlanId || candidate.planName || candidate.name);
    const status = String(candidate.status || candidate.subscriptionStatus || "active").toLowerCase();
    if (planId && planId !== "free" && ["active", "paid", "trialing", "current"].includes(status)) {
      return {
        ...candidate,
        planId,
        billingCycle: candidate.billingCycle === "yearly" ? "yearly" : "monthly",
        status,
      };
    }
  }

  const userPlanId = findPlanId(user?.planId || user?.subscriptionPlanId || user?.subscriptionPlan || user?.planName);
  const userStatus = String(user?.subscriptionStatus || user?.planStatus || "").toLowerCase();
  if (userPlanId && userPlanId !== "free" && ["active", "paid", "trialing", "current"].includes(userStatus)) {
    return { planId: userPlanId, billingCycle: user?.billingCycle === "yearly" ? "yearly" : "monthly", status: userStatus };
  }

  return null;
}

export function isActivePaidPlan(subscription) {
  if (!subscription || typeof subscription !== "object") return false;
  const planId = findPlanId(subscription.planId || subscription.plan?.id || subscription.plan?.slug);
  const status = String(subscription.status || subscription.subscriptionStatus || "").toLowerCase();
  return Boolean(planId && planId !== "free" && ["active", "paid", "trialing", "current"].includes(status));
}

export function saveActiveSubscription(subscription) {
  localStorage.setItem(activeSubscriptionStorageKey, JSON.stringify(subscription));
}

export function updateActiveSubscription(updates) {
  const current = readActiveSubscription();
  if (!current) return null;
  const next = { ...current, ...updates };
  saveActiveSubscription(next);
  return next;
}

function findPlanId(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  const matched = planCatalog.find((plan) => plan.id === normalized || plan.name.toLowerCase() === normalized);
  return matched?.id || null;
}


export function getPaidPlanCheckoutPath(fallback = null) {
  const selection = readPlanSelection();
  const isPaidPlan = planCatalog.some((plan) => plan.id === selection?.planId && plan.id !== "free");
  return isPaidPlan ? "/checkout" : fallback;
}
