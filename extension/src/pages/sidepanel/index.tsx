import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SidePanel } from "./SidePanel";
import "./styles.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Side panel root element was not found.");
}

document.body.classList.add("browsegraph-sidepanel");

createRoot(rootElement).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>
);
