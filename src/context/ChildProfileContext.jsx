import { useCallback, useMemo, useState } from "react";
import { ChildProfileContext } from "./ChildProfileContextValue";

const storageKey = "focusLensChildProfile";

const initialChild = {
  preferredName: "",
  lastName: "",
  dateOfBirth: "",
  grade: "",
  otherGrade: "",
  profileSetupMode: null,
  email: "",
  subjects: [],
  otherSubject: "",
  otherSubjects: [],
  studyPriorities: [],
  suggestedGoal: null,
  studyTimeGoal: null,
};

function readStoredChild() {
  try {
    return { ...initialChild, ...JSON.parse(sessionStorage.getItem(storageKey) || "{}") };
  } catch {
    return initialChild;
  }
}

export function ChildProfileProvider({ children }) {
  const [child, setChild] = useState(readStoredChild);

  const updateChild = useCallback((update) => {
    setChild((current) => {
      const next = { ...current, ...update };
      sessionStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetChild = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setChild(initialChild);
  }, []);

  const value = useMemo(
    () => ({ child, updateChild, resetChild }),
    [child, resetChild, updateChild],
  );

  return (
    <ChildProfileContext.Provider value={value}>
      {children}
    </ChildProfileContext.Provider>
  );
}
