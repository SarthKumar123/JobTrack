import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LegalPage from "./components/LegalPage";
import "./index.css";
const path = window.location.pathname.replace(/\/+$/, "") || "/";
const content =
  path === "/privacy" ? <LegalPage type="privacy" /> :
  path === "/terms" ? <LegalPage type="terms" /> :
  <App />;

createRoot(document.getElementById("root")).render(
  <StrictMode>{content}</StrictMode>,
);
