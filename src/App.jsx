import { Analytics } from "@vercel/analytics/react";
import AppRouter from "./router/AppRouter";

export default function App() {
  return (
    <>
      <AppRouter />
      <Analytics />
    </>
  );
}
