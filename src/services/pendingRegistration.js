// The backend's verify-email endpoint confirms the address but returns no
// session, so the new parent is signed in with the password they just chose.
// It is kept only in memory (never in storage) between the password and
// verification steps; a reload drops it and the parent signs in normally.
let pendingPassword = null;

export function holdRegistrationPassword(password) {
  pendingPassword = password || null;
}

export function takeRegistrationPassword() {
  const password = pendingPassword;
  pendingPassword = null;
  return password;
}
