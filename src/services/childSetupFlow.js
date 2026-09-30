export function getDraftProfileSetupMode(draft, fallback = null) {
  if (!draft || !Object.prototype.hasOwnProperty.call(draft, "profileSetupMode")) {
    return fallback;
  }
  return draft.profileSetupMode ?? null;
}

export async function saveProfileSetupModeAndContinue({
  draftId,
  profileSetupMode,
  request,
  onSaved,
  navigate,
  nextPath,
}) {
  if (!draftId) throw new Error("Your child setup draft is missing. Please start setup again.");
  if (!["ParentManaged", "ChildManaged"].includes(profileSetupMode)) {
    throw new Error("Choose who will set up the profile.");
  }

  await request(
    `/api/parents/child-setups/${encodeURIComponent(draftId)}/profile-setup-mode`,
    {
      method: "PUT",
      body: { profileSetupMode },
    },
  );

  onSaved?.(profileSetupMode);
  navigate(nextPath);
}

export function createEmailChildSetupInvitation(draftId, childEmail, request) {
  return request(`/api/parents/child-setups/${encodeURIComponent(draftId)}/invite`, {
    method: "POST",
    body: { childEmail },
  });
}

export function createLinkChildSetupInvitation(draftId, request) {
  return request(
    `/api/parents/child-setups/${encodeURIComponent(draftId)}/invite/link/create`,
    { method: "POST" },
  );
}

export function getChildSetupValidationMessage(error) {
  const details = typeof error?.details === "string"
    ? error.details
    : JSON.stringify(error?.details || {});
  const backendError = `${error?.message || ""} ${details}`;

  if (/ChildSetup\.Incomplete/i.test(backendError)) {
    return "Complete the required child profile information before sending an invitation.";
  }
  if (/ChildSetup\.ProfileSetupModeRequired/i.test(backendError)) {
    return "Choose who will set up the profile, then try again.";
  }
  return null;
}

// The backend only creates a link invitation for a setup that is still a
// draft. When the setup already has a pending invitation (for example after
// a reload, or after sending it by email), a pending link invitation is
// reissued to get its URL, and an email invitation is cancelled so a link can
// replace it. Returns the reissued invitation, or null when the setup is a
// draft and a new link invitation can be created.
export async function reuseOrReleaseChildSetupInvitation(draftId, request) {
  const encodedId = encodeURIComponent(draftId);
  const draft = await request(`/api/parents/child-setups/${encodedId}`);
  if (draft?.status !== "Invited") return null;

  const invitations = await request("/api/parents/child-setups/invitations");
  const current = Array.isArray(invitations)
    ? invitations.find((item) => item.draftId === draftId)
    : null;

  if (current?.type === "Link") {
    return request(`/api/parents/child-setups/${encodedId}/invite/link`, { method: "POST" });
  }

  await request(`/api/parents/child-setups/${encodedId}/invite/cancel`, { method: "POST" });
  return null;
}
