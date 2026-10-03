import { useCallback, useEffect, useState } from "react";
import { api, clearSession, forgetRememberedSession, saveTokens } from "../services/api";
import { clearSetupDeferred } from "../services/setupDeferral";
import { AuthContext } from "./AuthContextValue";

function storedUser() {
  try { return JSON.parse(sessionStorage.getItem("focusLensUser")); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem("accessToken")));

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) sessionStorage.setItem("focusLensUser", JSON.stringify(nextUser));
    else sessionStorage.removeItem("focusLensUser");
  }, []);

  const login = useCallback((response) => {
    saveTokens(response.tokens);
    const nextUser = {
      userId: response.userId, email: response.email, firstName: response.firstName,
      lastName: response.lastName, roles: response.roles || [],
      requiresOnboarding: response.requiresOnboarding,
      onboardingStatus: response.onboardingStatus,
    };
    persistUser(nextUser);
    return nextUser;
  }, [persistUser]);

  const refreshUser = useCallback(async () => {
    const profile = await api("/api/users/me");
    // /api/users/me returns `id`; sign-in returns `userId`. Keep both shapes
    // so pages keyed on userId don't reload when the profile refreshes.
    const nextUser = { ...storedUser(), ...profile, userId: profile?.userId || profile?.id };
    persistUser(nextUser);
    return nextUser;
  }, [persistUser]);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem("refreshToken");
    const currentUser = storedUser();
    try {
      if (refreshToken) await api("/api/auth/logout", { method: "POST", body: { refreshToken } });
    } finally {
      clearSession();
      // Signing out on purpose ends the remembered session too; the email
      // stays remembered for the sign-in form.
      forgetRememberedSession();
      clearSetupDeferred(currentUser);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) return;
    let active = true;
    const timer = window.setTimeout(() => {
      refreshUser()
        .catch(() => {
          if (!active) return;
          clearSession();
          setUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [refreshUser]);

  return <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, refreshUser, logout, setUser: persistUser }}>{children}</AuthContext.Provider>;
}
