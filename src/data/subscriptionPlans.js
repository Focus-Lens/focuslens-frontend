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

export function getPlanPrice(plan, billingCycle) {
  return billingCycle === "yearly"
    ? Math.round(plan.monthlyPrice * 12 * 0.8)
    : plan.monthlyPrice;
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
