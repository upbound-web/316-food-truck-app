import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

// Register PWA service worker using Vite PWA plugin
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('App update available');
    // You can show a prompt to user here
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(r) {
    console.log('SW Registered: ' + r);
  },
  onRegisterError(error) {
    console.log('SW registration error', error);
  }
});

// Validate Convex URL before creating client
const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl || typeof convexUrl !== 'string' || !convexUrl.startsWith('https://')) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 40px; font-family: system-ui; text-align: center; color: #dc2626;';
  errorDiv.innerHTML = `
    <h1>Configuration Error</h1>
    <p>The app is not properly configured. Please contact support.</p>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">Error: Missing or invalid CONVEX_URL</p>
  `;
  document.getElementById("root")!.appendChild(errorDiv);
  throw new Error(`Invalid VITE_CONVEX_URL: ${convexUrl}`);
}

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>,
);
