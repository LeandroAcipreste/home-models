import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

if (typeof window !== "undefined") {
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  } catch {
    /* ignore */
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
