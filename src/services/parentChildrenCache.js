const cacheKey = "focusLensOverviewChildren";
const activeChildKey = "focusLensActiveParentChildId";

export function getActiveParentChildId() {
  try {
    return sessionStorage.getItem(activeChildKey) || "";
  } catch {
    return "";
  }
}

export function setActiveParentChild(studentId) {
  if (!studentId) return;
  try {
    sessionStorage.setItem(activeChildKey, String(studentId));
    window.dispatchEvent(new Event("focuslens:active-child-changed"));
  } catch {
    // Keep the current page usable if browser storage is unavailable.
  }
}

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

function parentChildStatuses(child) {
  return [
    child?.connectionStatus,
    child?.relationshipStatus,
    child?.parentConnectionStatus,
    child?.accessStatus,
    child?.invitationStatus,
    child?.childSetupInvitationStatus,
    child?.status,
    child?.relationship?.status,
    child?.connection?.status,
    child?.access?.status,
  ]
    .filter((value) => typeof value === "string")
    .map((value) => value.toLowerCase().replace(/[^a-z]/g, ""));
}

export function isPausedParentChild(child) {
  return Boolean(
    child?.isPaused ||
    child?.isConnectionPaused ||
    child?.pausedAtUtc ||
    parentChildStatuses(child).some((status) => status.includes("paused") || status.includes("suspended")),
  );
}

export function isPendingParentChild(child) {
  const statuses = parentChildStatuses(child);
  return Boolean(
    (!child?.studentId && child?.type === "ChildSetup" && child?.childSetupInvitationStatus === "Pending") ||
    statuses.some((status) =>
      status.includes("pending") || status.includes("awaitingchildapproval") || status.includes("awaitingapproval")
    ),
  );
}

export function isConnectedParentChild(child) {
  return Boolean(child?.studentId) && !isPausedParentChild(child) && !isPendingParentChild(child);
}

export function findConnectedChild(children) {
  const activeStudentId = getActiveParentChildId();
  return (
    children?.find((item) => isConnectedParentChild(item) && String(item.studentId) === activeStudentId) ||
    children?.find(isConnectedParentChild) ||
    null
  );
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
