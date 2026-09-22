const cacheKey = "focusLensChildInvitationDraft";

export function getChildInvitationDraft() {
  try {
    const saved = localStorage.getItem(cacheKey);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveChildInvitationDraft(update) {
  localStorage.setItem(
    cacheKey,
    JSON.stringify({ ...getChildInvitationDraft(), ...update })
  );
}
