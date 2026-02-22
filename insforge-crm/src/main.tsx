import { InsforgeProvider } from "@insforge/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { insforge } from "./config/insforge";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
  <StrictMode>
    <InsforgeProvider client={insforge}>
      <App />
    </InsforgeProvider>
  </StrictMode>,
);
