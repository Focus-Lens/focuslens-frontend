import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ChildProfileContext = createContext(null);
const storageKey = "focusLensChildProfile";

const initialChild = {
  preferredName: "",
  lastName: "",
  dateOfBirth: "",
  grade: "",
  email: "",
  subjects: [],
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

export function useChildProfile() {
  const context = useContext(ChildProfileContext);
  if (!context) throw new Error("useChildProfile must be used within ChildProfileProvider");
  return context;
}
