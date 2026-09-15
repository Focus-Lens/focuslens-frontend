/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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
import { getStudents, getStudent } from "../services/access";
import { getCurrentUser } from "../services/users";

const AuthContext = createContext(null);

// ------------------------------------------------------------
// تطبيع بيانات ولي الأمر القادمة من الـ API فوق القيم الافتراضية،
// حتى لو اختلفت أسماء بعض الحقول أو كانت الاستجابة غير مكتملة —
// الواجهة لا تنكسر ولا يظهر أي شكل مختلف عن المتوقع.
// ------------------------------------------------------------
function normalizeParent(raw) {
  if (!raw || typeof raw !== "object") return null;

  const firstName = raw.firstName ?? "";
  const lastName = raw.lastName ?? "";

  return {
    ...raw,
    firstName,
    lastName,
    fullName:
      raw.fullName ??
      [firstName, lastName].filter(Boolean).join(" ") ??
      "Parent",
    email: raw.email ?? "",
    hasChild: Boolean(raw.hasChild),
  };
}

function normalizeChild(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    ...raw,
    fullName: raw.fullName ?? [raw.firstName, raw.lastName].filter(Boolean).join(" "),
    preferredName:
      raw.preferredName ?? raw.firstName ?? raw.fullName ?? "Student",
    subjects: Array.isArray(raw.subjects)
      ? raw.subjects.map((subject) => subject.customName ?? subject.type ?? subject)
      : [],
    studyPriorities: Array.isArray(raw.studyPriorities ?? raw.priorities)
      ? raw.studyPriorities ?? raw.priorities
      : [],
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
      const [accountResponse, parentResponse, studentsResponse] = await Promise.all([
        getCurrentUser(),
        getMe(),
        getStudents(),
      ]);

      const normalizedUser = normalizeParent({
        ...parentResponse,
        ...accountResponse,
      });
      if (!normalizedUser) throw new Error("Parent profile is unavailable.");

      const studentsList = Array.isArray(studentsResponse)
        ? studentsResponse
        : Array.isArray(studentsResponse?.items)
        ? studentsResponse.items
        : [];

      setStudents(studentsList);

      const childDetails = studentsList.length > 0
        ? await getStudent(studentsList[0].id)
        : null;
      const normalizedChild = normalizeChild(childDetails);

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
      const loaded = await loadProfile();
      if (!loaded) throw new Error("Unable to load the parent profile.");
    },
    [loadProfile]
  );

  const registerParent = useCallback(
    async ({ email, password, firstName, lastName, acceptTerms }) => {
      return registerParentRequest({
        email,
        password,
        firstName,
        lastName,
        acceptTerms,
      });
    },
    []
  );

  const loginWithGoogleParent = useCallback(
    async (idToken) => {
      await loginWithGoogleParentRequest(idToken);
      const loaded = await loadProfile();
      if (!loaded) throw new Error("Unable to load the parent profile.");
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
    user: user ?? { firstName: "", lastName: "", fullName: "", email: "", hasChild: false },
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
