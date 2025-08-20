import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializePWA } from "./lib/pwa";
import { setupMobileConfig } from "./utils/mobile-config";

// Initialize mobile configuration first
setupMobileConfig();

// Initialize PWA features
initializePWA();

createRoot(document.getElementById("root")!).render(<App />);
