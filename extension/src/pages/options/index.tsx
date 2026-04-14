import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { OptionsApp } from "./Options";
import "./styles.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Options root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
