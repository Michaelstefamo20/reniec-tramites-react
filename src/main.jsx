import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Shell from "./components/Shell.jsx";
import { LanguageProvider } from "./components/LanguageProvider.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  </StrictMode>
);