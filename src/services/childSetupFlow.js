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
