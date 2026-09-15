import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  parent as parentDefaults,
  child as childDefaults,
} from "../data/mockData";

import {
  clearTokens,
  hasSession,
} from "../services/apiClient";

import {
  login as loginRequest,
  registerParent as registerParentRequest,
  loginWithGoogleParent as loginWithGoogleParentRequest,
  logout as logoutRequest,
} from "../services/auth";

import { getMe } from "../services/parents";
import { getStudents } from "../services/access";

const AuthContext = createContext(null);

// ------------------------------------------------------------
// تطبيع بيانات ولي الأمر القادمة من الـ API فوق القيم الافتراضية،
// حتى لو اختلفت أسماء بعض الحقول أو كانت الاستجابة غير مكتملة —
// الواجهة لا تنكسر ولا يظهر أي شكل مختلف عن المتوقع.
// ------------------------------------------------------------
function normalizeParent(raw) {
  if (!raw || typeof raw !== "object") return null;

  const firstName = raw.firstName ?? parentDefaults.firstName;
  const lastName = raw.lastName ?? "";

  return {
    ...parentDefaults,
    ...raw,
    firstName,
    lastName,
    fullName:
      raw.fullName ??
      [firstName, lastName].filter(Boolean).join(" ") ??
      parentDefaults.fullName,
    email: raw.email ?? parentDefaults.email,
    hasChild:
      typeof raw.hasChild === "boolean" ? raw.hasChild : parentDefaults.hasChild,
  };
}

function normalizeChild(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    ...childDefaults,
    ...raw,
    preferredName:
      raw.preferredName ?? raw.fullName ?? childDefaults.preferredName,
    fullName: raw.fullName ?? childDefaults.fullName,
    subjects: Array.isArray(raw.subjects) ? raw.subjects : childDefaults.subjects,
    studyPriorities: Array.isArray(raw.studyPriorities ?? raw.priorities)
      ? raw.studyPriorities ?? raw.priorities
      : childDefaults.studyPriorities,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [child, setChild] = useState(null);
  const [students, setStudents] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const [meResponse, studentsResponse] = await Promise.all([
        getMe().catch(() => null),
        getStudents().catch(() => null),
      ]);

      const normalizedUser = normalizeParent(meResponse) ?? parentDefaults;

      const studentsList = Array.isArray(studentsResponse)
        ? studentsResponse
        : Array.isArray(studentsResponse?.items)
        ? studentsResponse.items
        : [];

      setStudents(studentsList);

      const normalizedChild =
        studentsList.length > 0 ? normalizeChild(studentsList[0]) : null;

      setUser({
        ...normalizedUser,
        hasChild: studentsList.length > 0 || normalizedUser.hasChild,
      });
      setChild(normalizedChild);
      setIsAuthenticated(true);

      return true;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (!hasSession()) {
        if (isMounted) setLoading(false);
        return;
      }

      await loadProfile();

      if (isMounted) setLoading(false);
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      await loginRequest({ email, password });
      await loadProfile();
    },
    [loadProfile]
  );

  const registerParent = useCallback(
    async ({ email, password, firstName, lastName, acceptTerms }) => {
      await registerParentRequest({
        email,
        password,
        firstName,
        lastName,
        acceptTerms,
      });
      await loadProfile();
    },
    [loadProfile]
  );

  const loginWithGoogleParent = useCallback(
    async (idToken) => {
      await loginWithGoogleParentRequest(idToken);
      await loadProfile();
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearTokens();
      setUser(null);
      setChild(null);
      setStudents([]);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshUser = useCallback(() => loadProfile(), [loadProfile]);

  const value = {
    user: user ?? parentDefaults,
    setUser,
    child,
    setChild,
    students,
    isAuthenticated,
    loading,
    login,
    registerParent,
    loginWithGoogleParent,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
