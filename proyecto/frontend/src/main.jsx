import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { Provider as TooltipProvider } from "./components/ui/Tooltip";
import App from "./App";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = document.getElementById("root");

window.onerror = function(msg, url, line, col, error) {
  root.innerHTML = `<div style="padding:20px;background:#1a1a2e;color:#e94560;font-family:monospace;">
    <h2>Runtime Error</h2>
    <pre>${msg}\n${error?.stack || ""}</pre>
  </div>`;
  return true;
};

if (!PUBLISHABLE_KEY) {
  root.innerHTML = `<div style="padding:20px;background:#1a1a2e;color:#e94560;font-family:monospace;">
    <h2>Missing VITE_CLERK_PUBLISHABLE_KEY</h2>
    <p>Add it to your .env file.</p>
  </div>`;
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ThemeProvider>
          <TooltipProvider>
          <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </ClerkProvider>
    </React.StrictMode>
  );
}
