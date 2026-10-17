import { useState } from "react";
import AppRouter from "./router/AppRouter";
import FocusLensSplash from "./components/ui/FocusLensSplash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return showSplash ? (
    <FocusLensSplash onComplete={() => setShowSplash(false)} />
  ) : (
    <AppRouter />
  );
}
