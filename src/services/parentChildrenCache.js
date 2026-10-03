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
  const previousChildren = getCachedParentChildren() || [];
  const preferredNames = new Map(
    previousChildren
      .filter((child) => child.studentId && child.preferredName)
      .map((child) => [child.studentId, child.preferredName]),
  );
  const nextChildren = Array.isArray(children)
    ? children.map((child) => ({
        ...child,
        preferredName: child.preferredName || preferredNames.get(child.studentId),
      }))
    : [];

  sessionStorage.setItem(cacheKey, JSON.stringify({
    parentEmail: currentParentEmail(),
    children: nextChildren,
  }));
}

export function cacheStudentPreferredName(studentId, preferredName) {
  if (!studentId || !preferredName?.trim()) return;
  const children = getCachedParentChildren();
  if (!children) return;
  cacheParentChildren(children.map((child) =>
    child.studentId === studentId
      ? { ...child, preferredName: preferredName.trim() }
      : child,
  ));
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
