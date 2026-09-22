const cacheKey = "focusLensOverviewChildren";

function currentParentEmail() {
  try {
    return JSON.parse(sessionStorage.getItem("focusLensUser"))?.email?.toLowerCase() || "";
  } catch {
    return "";
  }
}

export function getCachedParentChildren() {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    const parsed = cached ? JSON.parse(cached) : null;
    // Never reuse another parent's children list after switching accounts.
    if (!parsed || !Array.isArray(parsed.children)) return null;
    if (parsed.parentEmail !== currentParentEmail()) return null;
    return parsed.children;
  } catch {
    return null;
  }
}

export function cacheParentChildren(children) {
  sessionStorage.setItem(cacheKey, JSON.stringify({
    parentEmail: currentParentEmail(),
    children: Array.isArray(children) ? children : [],
  }));
}

export function findConnectedChild(children) {
  return children?.find((item) => item.studentId) || null;
}

export function findPendingChild(children) {
  return (
    children?.find(
      (item) =>
        !item.studentId &&
        item.type === "ChildSetup" &&
        item.childSetupInvitationStatus === "Pending"
    ) || null
  );
}
