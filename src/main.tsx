import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Polyfill a safe global navigate() for older bundles or unexpected contexts
// This ensures clicks referencing `navigate(...)` don't throw ReferenceError in production
if (typeof (window as any).navigate === 'undefined') {
  (window as any).navigate = (path: string) => { window.location.href = path; };
}

createRoot(document.getElementById("root")!).render(<App />);
