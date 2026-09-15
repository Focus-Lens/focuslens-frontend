// ============================================================
// auth.js — خدمات المصادقة (Auth) الخاصة بولي الأمر
// ============================================================

import {
  apiPost,
  setTokens,
  clearTokens,
  getRefreshToken,
} from "./apiClient";

export async function registerParent({
  email,
  password,
  firstName,
  lastName,
  acceptTerms,
}) {
  const data = await apiPost(
    "/api/auth/register/parent",
    { email, password, firstName, lastName, acceptTerms },
    { auth: false }
  );

  return data;
}

function storeAuthTokens(data) {
  const tokens = data?.tokens ?? data;
  if (tokens?.accessToken && tokens?.refreshToken) {
    setTokens(tokens);
  }
}

export async function login({ email, password }) {
  const data = await apiPost(
    "/api/auth/login",
    { email, password },
    { auth: false }
  );

  storeAuthTokens(data);

  return data;
}

export async function loginWithGoogleParent(idToken) {
  const data = await apiPost(
    "/api/auth/google/parent",
    { idToken },
    { auth: false }
  );

  storeAuthTokens(data);

  return data;
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await apiPost(
        "/api/auth/logout",
        { refreshToken },
        { auth: false, skipAuthRetry: true }
      );
    }
  } finally {
    clearTokens();
  }
}

export function verifyEmail({ email, otp }) {
  return apiPost("/api/auth/verify-email", { email, otp }, { auth: false });
}

export function resendVerification({ email }) {
  return apiPost(
    "/api/auth/resend-verification",
    { email },
    { auth: false }
  );
}

export function forgotPassword({ email }) {
  return apiPost("/api/auth/forgot-password", { email }, { auth: false });
}

export function resetPassword({ email, otp, newPassword }) {
  return apiPost(
    "/api/auth/reset-password",
    { email, otp, newPassword },
    { auth: false }
  );
}
