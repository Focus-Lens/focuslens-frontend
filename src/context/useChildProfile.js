import { useContext } from "react";
import { ChildProfileContext } from "./ChildProfileContextValue";

export function useChildProfile() {
  const context = useContext(ChildProfileContext);
  if (!context) throw new Error("useChildProfile must be used within ChildProfileProvider");
  return context;
}
