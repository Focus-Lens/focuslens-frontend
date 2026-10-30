const billingContactStorageKey = "focuslens.billingContact";

export function readBillingContact(fallback = {}) {
  try {
    const saved = JSON.parse(localStorage.getItem(billingContactStorageKey) || "{}");
    return { ...fallback, ...saved };
  } catch {
    return fallback;
  }
}

export function saveBillingContact(contact) {
  localStorage.setItem(billingContactStorageKey, JSON.stringify(contact));
}
