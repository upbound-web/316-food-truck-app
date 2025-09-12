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

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>,
);
