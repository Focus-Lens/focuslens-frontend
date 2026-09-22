import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearSession, saveTokens } from "../services/api";

const AuthContext = createContext(null);

function storedUser() {
  try { return JSON.parse(sessionStorage.getItem("focusLensUser")); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storedUser);
  const [loading, setLoading] = useState(true);

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
    const nextUser = await api("/api/users/me");
    persistUser(nextUser);
    return nextUser;
  }, [persistUser]);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem("refreshToken");
    try {
      if (refreshToken) await api("/api/auth/logout", { method: "POST", body: { refreshToken } });
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("accessToken")) { setLoading(false); return; }
    refreshUser().catch(() => { clearSession(); setUser(null); }).finally(() => setLoading(false));
  }, [refreshUser]);

  return <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, refreshUser, logout, setUser: persistUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
