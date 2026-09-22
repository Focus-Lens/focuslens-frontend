const cacheKey = "focusLensPendingInvitation";

export function getPendingInvitation() {
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function getPendingInvitationForUser(email) {
  const invitation = getPendingInvitation();

  return invitation && invitation.parentEmail === email ? invitation : null;
}

export function cachePendingInvitation(invitation) {
  localStorage.setItem(cacheKey, JSON.stringify(invitation));
}

export function clearPendingInvitation() {
  localStorage.removeItem(cacheKey);
}
