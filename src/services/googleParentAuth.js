import { ApiError, api } from "./api";
import { getGoogleProfile } from "./googleIdentity";
import {
  getEmailAvailability,
  isStudentEmailError,
  isStudentEmailResult,
} from "./emailAccountStatus";

export const STUDENT_EMAIL_MESSAGE =
  "This email belongs to a student account. Please use the student sign-in page.";

// Signs the parent in with the selected Google account in one step. The
// backend's google/parent endpoint signs in an existing account or creates a
// new one, so no password or extra confirmation is needed.
export async function continueWithGoogleParent(idToken, login) {
  const profile = getGoogleProfile(idToken);
  if (!profile.email) throw new Error("Google did not provide an email address.");

  let isNewAccount;
  try {
    const emailStatus = await api("/api/auth/check-email", {
      method: "POST",
      auth: false,
      body: { email: profile.email },
    });
    if (isStudentEmailResult(emailStatus)) throw new ApiError(STUDENT_EMAIL_MESSAGE, 409);
    isNewAccount = getEmailAvailability(emailStatus) === true;
  } catch (error) {
    if (isStudentEmailError(error)) throw new ApiError(STUDENT_EMAIL_MESSAGE, error.status);
    throw error;
  }

  let response;
  try {
    response = await api("/api/auth/google/parent", {
      method: "POST",
      auth: false,
      body: { idToken },
    });
  } catch (error) {
    if (isStudentEmailError(error) || /account.?type|mismatch/i.test(`${error.message} ${JSON.stringify(error.details || {})}`)) {
      throw new ApiError(STUDENT_EMAIL_MESSAGE, error.status);
    }
    throw error;
  }

  const account = login({
    ...response,
    firstName: response.firstName || profile.firstName,
    lastName: response.lastName || profile.lastName,
    email: response.email || profile.email,
  });

  const nextPath = sessionStorage.getItem("pendingInvitationToken")
    ? "/choose-start"
    : isNewAccount || account.requiresOnboarding
      ? "/account-created"
      : "/overview";

  return { profile, nextPath, account };
}
